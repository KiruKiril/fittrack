import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TrainingService } from '../../core/services/training.service';
import { UebungService } from '../../core/services/uebung.service';
import { LogService } from '../../core/services/log.service';
import { Training } from '../../core/models/training.model';
import { UebungTyp } from '../../core/models/uebung.model';
import { TrainingAusfuehrung } from '../../core/models/log.model';
import { extractErrorMessage } from '../../core/error-message';
import { LiveSessionTracker } from '../../core/services/live-session-tracker';

type Phase = 'intro' | 'performing' | 'resting' | 'done';

interface PlanStep {
  uebungId: number;
  uebungName: string;
  typ: UebungTyp;
  kind: 'satz' | 'ausdauer';
  setIndex: number;
  setCount: number;
  isLastStepOfExercise: boolean;
  isLastStepOverall: boolean;
  pauseAfterSameExercise: number;
  pauseAfterExercise: number;
  zielLabel: string;
}

interface SatzResult {
  kind: 'satz';
  wiederholungen: number;
  gewicht: number;
  dropset: boolean;
}

interface AusdauerResult {
  kind: 'ausdauer';
  distanzKm: number;
  dauerMinuten: number;
  hfAvg: number | null;
  hfMax: number | null;
  hoehenmeter: number | null;
  notiz: string;
}

type StepResult = SatzResult | AusdauerResult;

interface PersistedState {
  stepIndex: number;
  phase: Phase;
  restEndsAt: number | null;
  results: (StepResult | null)[];
  ort: string;
  trainingName: string;
}

@Component({
  selector: 'app-live-session',
  imports: [FormsModule, RouterLink],
  templateUrl: './live-session.html',
  styleUrl: './live-session.scss'
})
export class LiveSession implements OnDestroy {
  private trainingService = inject(TrainingService);
  private uebungService = inject(UebungService);
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private liveSessionTracker = inject(LiveSessionTracker);

  private trainingId = Number(this.route.snapshot.paramMap.get('id'));
  private storageKey = `fittrack-live-${this.trainingId}`;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private restEndsAt: number | null = null;

  training = signal<Training | null>(null);
  steps: PlanStep[] = [];
  results: (StepResult | null)[] = [];

  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  createdLogId = signal<number | null>(null);

  phase = signal<Phase>('intro');
  stepIndex = signal(0);
  timeLeft = signal(0);

  ort = '';

  inputReps: number | null = null;
  inputGewicht: number | null = null;
  inputDropset = false;
  inputDistanzKm: number | null = null;
  inputDauerMinuten: number | null = null;
  inputHfAvg: number | null = null;
  inputHfMax: number | null = null;
  inputHoehenmeter: number | null = null;
  inputNotiz = '';

  currentStep = computed<PlanStep | null>(() => this.steps[this.stepIndex()] ?? null);
  nextStep = computed<PlanStep | null>(() => this.steps[this.stepIndex() + 1] ?? null);
  progressLabel = computed(() => {
    const step = this.currentStep();
    if (!step) return '';
    const uebungIndex = this.uniqueUebungIndex(this.stepIndex());
    const uebungCount = new Set(this.steps.map((s) => s.uebungId)).size;
    return step.kind === 'satz'
      ? `Übung ${uebungIndex}/${uebungCount} · Satz ${step.setIndex}/${step.setCount}`
      : `Übung ${uebungIndex}/${uebungCount}`;
  });

  constructor() {
    forkJoin({
      training: this.trainingService.getOne(this.trainingId),
      uebungen: this.uebungService.getAll()
    }).subscribe({
      next: ({ training, uebungen }) => {
        this.training.set(training);
        const typById = new Map(uebungen.map((u) => [u.id, u.typ]));
        this.steps = this.buildSteps(training, typById);
        this.results = new Array(this.steps.length).fill(null);
        this.restoreIfPresent();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
  }

  private buildSteps(training: Training, typById: Map<number | undefined, UebungTyp | undefined>): PlanStep[] {
    const steps: PlanStep[] = [];

    for (const pu of training.uebungen) {
      const typ = typById.get(pu.uebungId) ?? 'KRAFT';
      const pauseSatz = pu.pauseZwischenSaetzenSekunden ?? training.defaultPauseZwischenSaetzenSekunden;
      const pauseUebung = pu.pauseNachUebungSekunden ?? training.defaultPauseZwischenUebungenSekunden;

      const zielTeile: string[] = [];
      if (typ === 'KRAFT' && pu.empfSaetze) zielTeile.push(`${pu.empfSaetze} Sätze`);
      if (typ === 'AUSDAUER' && pu.empfDistanzMeter) zielTeile.push(`${pu.empfDistanzMeter / 1000} km`);
      if (typ === 'AUSDAUER' && pu.empfDauerSekunden) zielTeile.push(`${pu.empfDauerSekunden / 60} min`);
      const zielLabel = zielTeile.length ? `Ziel: ${zielTeile.join(' · ')}` : '';

      if (typ === 'KRAFT') {
        const setCount = Math.max(1, pu.empfSaetze || 1);
        for (let s = 1; s <= setCount; s++) {
          steps.push({
            uebungId: pu.uebungId,
            uebungName: pu.uebungName ?? '',
            typ,
            kind: 'satz',
            setIndex: s,
            setCount,
            isLastStepOfExercise: s === setCount,
            isLastStepOverall: false,
            pauseAfterSameExercise: pauseSatz,
            pauseAfterExercise: pauseUebung,
            zielLabel
          });
        }
      } else {
        steps.push({
          uebungId: pu.uebungId,
          uebungName: pu.uebungName ?? '',
          typ,
          kind: 'ausdauer',
          setIndex: 1,
          setCount: 1,
          isLastStepOfExercise: true,
          isLastStepOverall: false,
          pauseAfterSameExercise: pauseSatz,
          pauseAfterExercise: pauseUebung,
          zielLabel
        });
      }
    }

    if (steps.length > 0) {
      steps[steps.length - 1].isLastStepOverall = true;
    }
    return steps;
  }

  private uniqueUebungIndex(atStepIndex: number): number {
    const uebungId = this.steps[atStepIndex]?.uebungId;
    const seen = new Set<number>();
    for (let i = 0; i <= atStepIndex; i++) {
      seen.add(this.steps[i].uebungId);
    }
    return seen.size;
  }

  start(): void {
    this.phase.set('performing');
    this.liveSessionTracker.start(this.trainingId, this.training()?.name ?? '');
    this.persist();
  }

  finishCurrentStep(): void {
    const step = this.currentStep();
    if (!step) return;

    this.results[this.stepIndex()] = step.kind === 'satz'
      ? { kind: 'satz', wiederholungen: this.inputReps ?? 0, gewicht: this.inputGewicht ?? 0, dropset: this.inputDropset }
      : {
          kind: 'ausdauer',
          distanzKm: this.inputDistanzKm ?? 0,
          dauerMinuten: this.inputDauerMinuten ?? 0,
          hfAvg: this.inputHfAvg,
          hfMax: this.inputHfMax,
          hoehenmeter: this.inputHoehenmeter,
          notiz: this.inputNotiz
        };

    if (step.isLastStepOverall) {
      this.finishSession();
      return;
    }

    const pause = step.isLastStepOfExercise ? step.pauseAfterExercise : step.pauseAfterSameExercise;
    this.beginRest(pause);
  }

  private beginRest(seconds: number): void {
    this.restEndsAt = Date.now() + seconds * 1000;
    this.phase.set('resting');
    this.persist();
    this.tick();
  }

  private tick(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.updateTimeLeft();
    this.timerHandle = setInterval(() => {
      this.updateTimeLeft();
      if (this.timeLeft() <= 0) {
        this.beep();
        this.advanceToNextStep();
      }
    }, 250);
  }

  private updateTimeLeft(): void {
    if (this.restEndsAt === null) {
      this.timeLeft.set(0);
      return;
    }
    this.timeLeft.set(Math.max(0, Math.round((this.restEndsAt - Date.now()) / 1000)));
  }

  skipRest(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.advanceToNextStep();
  }

  private advanceToNextStep(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.restEndsAt = null;
    this.stepIndex.update((v) => v + 1);
    this.resetInputs();
    this.phase.set('performing');
    this.persist();
  }

  private resetInputs(): void {
    this.inputReps = null;
    this.inputGewicht = null;
    this.inputDropset = false;
    this.inputDistanzKm = null;
    this.inputDauerMinuten = null;
    this.inputHfAvg = null;
    this.inputHfMax = null;
    this.inputHoehenmeter = null;
    this.inputNotiz = '';
  }

  private finishSession(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.phase.set('done');
    this.liveSessionTracker.clear();
    this.clearPersisted();
    this.submitLog();
  }

  private submitLog(): void {
    const training = this.training();
    if (!training?.id) return;

    const bySession = new Map<number, { uebungId: number; saetze: any[]; ausdauerEinheiten: any[] }>();

    this.steps.forEach((step, i) => {
      const result = this.results[i];
      if (!result) return;

      if (!bySession.has(step.uebungId)) {
        bySession.set(step.uebungId, { uebungId: step.uebungId, saetze: [], ausdauerEinheiten: [] });
      }
      const bucket = bySession.get(step.uebungId)!;

      if (result.kind === 'satz') {
        bucket.saetze.push({ wiederholungen: result.wiederholungen, gewicht: result.gewicht, dropset: result.dropset });
      } else {
        bucket.ausdauerEinheiten.push({
          dauerSekunden: Math.round(result.dauerMinuten * 60),
          distanzMeter: result.distanzKm * 1000,
          herzfrequenzDurchschnitt: result.hfAvg,
          herzfrequenzMax: result.hfMax,
          hoehenmeter: result.hoehenmeter,
          notiz: result.notiz || null
        });
      }
    });

    const payload: TrainingAusfuehrung = {
      trainingId: training.id,
      ort: this.ort || null,
      uebungSessions: Array.from(bySession.values())
    };

    this.saving.set(true);
    this.logService.create(payload).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.createdLogId.set(created.id ?? null);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Training konnte nicht gespeichert werden.'));
      }
    });
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  cancel(): void {
    if (!confirm('Training wirklich abbrechen? Bisherige Eingaben in dieser Session gehen verloren.')) return;
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.liveSessionTracker.clear();
    this.clearPersisted();
    this.router.navigate(['/trainings', this.trainingId]);
  }

  /** Live-Ansicht verlassen, ohne das Training zu beenden - der Fortschritt bleibt
   *  erhalten und die Shell zeigt eine Leiste, um spaeter genau hierher zurueckzukehren. */
  leave(): void {
    this.router.navigate(['/dashboard']);
  }

  private beep(): void {
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      osc.onended = () => ctx.close();
    } catch {
      // Web Audio nicht verfuegbar - Timer funktioniert trotzdem visuell weiter.
    }
  }

  private persist(): void {
    try {
      const state: PersistedState = {
        stepIndex: this.stepIndex(),
        phase: this.phase(),
        restEndsAt: this.restEndsAt,
        results: this.results,
        ort: this.ort,
        trainingName: this.training()?.name ?? ''
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // localStorage evtl. nicht verfuegbar - Fortschritt wird dann nicht ueberstanden.
    }
  }

  private clearPersisted(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private restoreIfPresent(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(this.storageKey);
    } catch {
      return;
    }
    if (!raw) return;

    try {
      const state = JSON.parse(raw) as PersistedState;
      if (state.stepIndex >= this.steps.length) return;

      this.stepIndex.set(state.stepIndex);
      this.results = state.results;
      this.ort = state.ort;

      if (state.phase === 'resting' && state.restEndsAt) {
        this.restEndsAt = state.restEndsAt;
        this.phase.set('resting');
        this.tick();
      } else if (state.phase === 'performing' || state.phase === 'resting') {
        this.phase.set('performing');
      }

      if (this.phase() === 'performing' || this.phase() === 'resting') {
        this.liveSessionTracker.start(this.trainingId, this.training()?.name ?? state.trainingName ?? '');
      }
    } catch {
      this.clearPersisted();
    }
  }
}
