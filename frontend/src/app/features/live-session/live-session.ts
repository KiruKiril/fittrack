import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TrainingService } from '../../core/services/training.service';
import { UebungService } from '../../core/services/uebung.service';
import { LogService } from '../../core/services/log.service';
import { Training } from '../../core/models/training.model';
import { Uebung, UebungTyp } from '../../core/models/uebung.model';
import { TrainingAusfuehrung } from '../../core/models/log.model';
import { extractErrorMessage } from '../../core/error-message';
import { LiveSessionTracker } from '../../core/services/live-session-tracker';
import { NumberStepper } from '../../shared/number-stepper/number-stepper';

type Phase = 'intro' | 'performing' | 'resting' | 'done';

/** Generischer Startwert fuer Wiederholungen, falls weder Historie noch Uebung.empfWiederholungen existiert. */
const DEFAULT_REPS_FALLBACK = 8;

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
  previousReps: number | null;
  previousGewicht: number | null;
  previousDistanzKm: number | null;
  previousDauerMinuten: number | null;
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

interface StepTiming {
  uebungId: number;
  uebungName: string;
  kind: 'satz' | 'ausdauer';
  setIndex: number;
  activeSeconds: number;
  restSeconds: number | null;
}

interface ExerciseTimingSummary {
  uebungName: string;
  activeSeconds: number;
  restSeconds: number;
  steps: StepTiming[];
}

interface PersistedState {
  stepIndex: number;
  phase: Phase;
  restEndsAt: number | null;
  results: (StepResult | null)[];
  ort: string;
  trainingName: string;
  sessionStartedAt: number | null;
  currentStepStartedAt: number | null;
  restStartedAt: number | null;
  timings: (StepTiming | null)[];
  sessionInputs: [number, SessionInput][];
}

interface SessionInput {
  reps: number | null;
  gewicht: number | null;
}

@Component({
  selector: 'app-live-session',
  imports: [FormsModule, RouterLink, NumberStepper],
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
  private sessionStartedAt: number | null = null;
  private currentStepStartedAt: number | null = null;
  private restStartedAt: number | null = null;
  /** Zuletzt in dieser Session fuer eine Uebung eingetragene Werte, pro uebungId isoliert - damit
   *  Satz 2+ vom vorherigen Satz DIESER Session uebernimmt, auch wenn keine Historie existiert. */
  private sessionInputsByUebungId = new Map<number, SessionInput>();

  training = signal<Training | null>(null);
  steps: PlanStep[] = [];
  results: (StepResult | null)[] = [];
  timings: (StepTiming | null)[] = [];

  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  createdLogId = signal<number | null>(null);

  totalSeconds = signal(0);
  activeSeconds = signal(0);
  restSecondsTotal = signal(0);
  exerciseSummaries = signal<ExerciseTimingSummary[]>([]);

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
      uebungen: this.uebungService.getAll(),
      logs: this.logService.getAll()
    }).subscribe({
      next: ({ training, uebungen, logs }) => {
        this.training.set(training);
        const uebungById = new Map(uebungen.map((u) => [u.id, u]));
        const sortedLogs = [...logs].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        this.steps = this.buildSteps(training, uebungById, sortedLogs);
        this.results = new Array(this.steps.length).fill(null);
        this.timings = new Array(this.steps.length).fill(null);
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

  private buildSteps(
    training: Training,
    uebungById: Map<number | undefined, Uebung>,
    sortedLogs: TrainingAusfuehrung[]
  ): PlanStep[] {
    const steps: PlanStep[] = [];

    for (const pu of training.uebungen) {
      const uebung = uebungById.get(pu.uebungId);
      const typ = uebung?.typ ?? 'KRAFT';
      const pauseSatz = pu.pauseZwischenSaetzenSekunden ?? training.defaultPauseZwischenSaetzenSekunden;
      const pauseUebung = pu.pauseNachUebungSekunden ?? training.defaultPauseZwischenUebungenSekunden;

      const zielTeile: string[] = [];
      if (typ === 'KRAFT' && pu.empfSaetze) zielTeile.push(`${pu.empfSaetze} Sätze`);
      if (typ === 'AUSDAUER' && pu.empfDistanzMeter) zielTeile.push(`${pu.empfDistanzMeter / 1000} km`);
      if (typ === 'AUSDAUER' && pu.empfDauerSekunden) zielTeile.push(`${pu.empfDauerSekunden / 60} min`);
      const zielLabel = zielTeile.length ? `Ziel: ${zielTeile.join(' · ')}` : '';

      if (typ === 'KRAFT') {
        const previousSaetze = this.findPreviousSaetze(pu.uebungId, sortedLogs);
        const previous = this.pickBestSatz(previousSaetze);
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
            zielLabel,
            // Ohne Historie (previous === null) auf den Uebungs-Zielwert zurueckfallen, sonst
            // auf einen generischen Startwert - das Feld soll beim allerersten Mal nicht leer sein.
            // empfWiederholungen ist ein primitives int (nie null) und daher 0, wenn nichts
            // gepflegt wurde - 0 zaehlt hier bewusst als "nicht gesetzt".
            previousReps: (previous?.wiederholungen ?? uebung?.empfWiederholungen) || DEFAULT_REPS_FALLBACK,
            previousGewicht: previous?.gewicht ?? null,
            previousDistanzKm: null,
            previousDauerMinuten: null
          });
        }
      } else {
        const previousEinheit = this.findPreviousAusdauer(pu.uebungId, sortedLogs);
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
          zielLabel,
          previousReps: null,
          previousGewicht: null,
          // Ohne Historie auf das im Trainingsplan hinterlegte Ziel dieser Uebung zurueckfallen.
          previousDistanzKm: previousEinheit
            ? previousEinheit.distanzMeter / 1000
            : pu.empfDistanzMeter
              ? pu.empfDistanzMeter / 1000
              : null,
          previousDauerMinuten: previousEinheit
            ? previousEinheit.dauerSekunden / 60
            : pu.empfDauerSekunden
              ? pu.empfDauerSekunden / 60
              : null
        });
      }
    }

    if (steps.length > 0) {
      steps[steps.length - 1].isLastStepOverall = true;
    }
    return steps;
  }

  /** Saetze der letzten Ausfuehrung dieser Uebung (falls vorhanden), zum Vorbefuellen. */
  private findPreviousSaetze(uebungId: number, sortedLogs: TrainingAusfuehrung[]) {
    for (const log of sortedLogs) {
      const session = log.uebungSessions.find((s) => s.uebungId === uebungId && s.saetze.length > 0);
      if (session) return session.saetze;
    }
    return [];
  }

  /**
   * Statt satzweise das letzte Mal nachzubilden (was bei ermuedungsbedingt sinkenden Werten
   * pro Satz irrefuehrend waere), wird EIN Referenzsatz gewaehlt und fuer alle Saetze dieses
   * Mal als Vorschlag verwendet: bei Uebungen mit Zusatzgewicht der Satz mit dem meisten
   * Gewicht (bei Gleichstand die meisten Wiederholungen), sonst (z.B. Bodyweight-Uebungen wie
   * Klimmzuege) der Satz mit den meisten Wiederholungen.
   */
  private pickBestSatz(saetze: { wiederholungen: number; gewicht: number }[]): { wiederholungen: number; gewicht: number } | null {
    if (saetze.length === 0) return null;

    const mitGewicht = saetze.filter((s) => s.gewicht > 0);
    const kandidaten = mitGewicht.length > 0 ? mitGewicht : saetze;
    const vergleicheNachGewicht = mitGewicht.length > 0;

    return kandidaten.reduce((best, aktuell) => {
      if (vergleicheNachGewicht) {
        if (aktuell.gewicht > best.gewicht) return aktuell;
        if (aktuell.gewicht === best.gewicht && aktuell.wiederholungen > best.wiederholungen) return aktuell;
        return best;
      }
      return aktuell.wiederholungen > best.wiederholungen ? aktuell : best;
    });
  }

  private findPreviousAusdauer(uebungId: number, sortedLogs: TrainingAusfuehrung[]) {
    for (const log of sortedLogs) {
      const session = log.uebungSessions.find((s) => s.uebungId === uebungId && s.ausdauerEinheiten.length > 0);
      if (session) return session.ausdauerEinheiten[0];
    }
    return null;
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
    this.sessionStartedAt = Date.now();
    this.currentStepStartedAt = Date.now();
    this.applyPreviousValues(this.currentStep());
    this.liveSessionTracker.start(this.trainingId, this.training()?.name ?? '');
    this.persist();
  }

  finishCurrentStep(): void {
    const step = this.currentStep();
    if (!step) return;

    if (step.kind === 'satz') {
      this.sessionInputsByUebungId.set(step.uebungId, { reps: this.inputReps, gewicht: this.inputGewicht });
    }

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

    const activeSeconds = this.currentStepStartedAt !== null
      ? Math.max(0, Math.round((Date.now() - this.currentStepStartedAt) / 1000))
      : 0;
    this.timings[this.stepIndex()] = {
      uebungId: step.uebungId,
      uebungName: step.uebungName,
      kind: step.kind,
      setIndex: step.setIndex,
      activeSeconds,
      restSeconds: null
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
    this.restStartedAt = Date.now();
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
    this.recordRestEnd();
    this.restEndsAt = null;
    this.stepIndex.update((v) => v + 1);
    this.currentStepStartedAt = Date.now();
    this.resetInputs();
    this.applyPreviousValues(this.currentStep());
    this.phase.set('performing');
    this.persist();
  }

  /** Traegt die tatsaechliche Pausendauer (egal ob abgelaufen oder uebersprungen) beim
   *  gerade zu Ende gegangenen Schritt nach - muss vor dem Erhoehen von stepIndex laufen. */
  private recordRestEnd(): void {
    if (this.restStartedAt === null) return;
    const restSeconds = Math.max(0, Math.round((Date.now() - this.restStartedAt) / 1000));
    const timing = this.timings[this.stepIndex()];
    if (timing) timing.restSeconds = restSeconds;
    this.restStartedAt = null;
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

  /** Befuellt Wiederholungen/Gewicht bzw. Distanz/Dauer, damit nicht jedes Mal alles neu
   *  eingetippt werden muss. Bevorzugt den zuletzt in DIESER Session fuer diese Uebung
   *  eingetragenen Wert (z.B. Satz 1 -> Satz 2); erst ohne einen solchen wird auf die
   *  historische letzte Ausfuehrung bzw. den generischen Default zurueckgefallen. */
  private applyPreviousValues(step: PlanStep | null): void {
    if (!step) return;
    if (step.kind === 'satz') {
      const sessionValues = this.sessionInputsByUebungId.get(step.uebungId);
      this.inputReps = sessionValues?.reps ?? step.previousReps;
      this.inputGewicht = sessionValues?.gewicht ?? step.previousGewicht;
    } else {
      this.inputDistanzKm = step.previousDistanzKm;
      this.inputDauerMinuten = step.previousDauerMinuten;
    }
  }

  private finishSession(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.phase.set('done');

    this.totalSeconds.set(
      this.sessionStartedAt !== null ? Math.max(0, Math.round((Date.now() - this.sessionStartedAt) / 1000)) : 0
    );
    this.activeSeconds.set(this.timings.reduce((sum, t) => sum + (t?.activeSeconds ?? 0), 0));
    this.restSecondsTotal.set(this.timings.reduce((sum, t) => sum + (t?.restSeconds ?? 0), 0));
    this.exerciseSummaries.set(this.buildExerciseSummaries());

    this.liveSessionTracker.clear();
    this.clearPersisted();
    this.submitLog();
  }

  private buildExerciseSummaries(): ExerciseTimingSummary[] {
    const byUebung = new Map<number, ExerciseTimingSummary>();
    for (const t of this.timings) {
      if (!t) continue;
      if (!byUebung.has(t.uebungId)) {
        byUebung.set(t.uebungId, { uebungName: t.uebungName, activeSeconds: 0, restSeconds: 0, steps: [] });
      }
      const entry = byUebung.get(t.uebungId)!;
      entry.activeSeconds += t.activeSeconds;
      entry.restSeconds += t.restSeconds ?? 0;
      entry.steps.push(t);
    }
    return Array.from(byUebung.values());
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
      dauerSekunden: this.totalSeconds(),
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
        trainingName: this.training()?.name ?? '',
        sessionStartedAt: this.sessionStartedAt,
        currentStepStartedAt: this.currentStepStartedAt,
        restStartedAt: this.restStartedAt,
        timings: this.timings,
        sessionInputs: Array.from(this.sessionInputsByUebungId.entries())
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
      this.sessionStartedAt = state.sessionStartedAt ?? Date.now();
      this.currentStepStartedAt = state.currentStepStartedAt ?? Date.now();
      this.restStartedAt = state.restStartedAt ?? null;
      this.timings = state.timings ?? new Array(this.steps.length).fill(null);
      this.sessionInputsByUebungId = new Map(state.sessionInputs ?? []);

      if (state.phase === 'resting' && state.restEndsAt) {
        this.restEndsAt = state.restEndsAt;
        this.phase.set('resting');
        this.tick();
      } else if (state.phase === 'performing' || state.phase === 'resting') {
        this.phase.set('performing');
      }

      if (this.phase() === 'performing') {
        this.applyPreviousValues(this.currentStep());
      }

      if (this.phase() === 'performing' || this.phase() === 'resting') {
        this.liveSessionTracker.start(this.trainingId, this.training()?.name ?? state.trainingName ?? '');
      }
    } catch {
      this.clearPersisted();
    }
  }
}
