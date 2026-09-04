import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TrainingService } from '../../../core/services/training.service';
import { UebungService } from '../../../core/services/uebung.service';
import { LogService } from '../../../core/services/log.service';
import { Training } from '../../../core/models/training.model';
import { UebungTyp } from '../../../core/models/uebung.model';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';

interface SatzRow {
  wiederholungen: number | null;
  gewicht: number | null;
  dropset: boolean;
}

interface AusdauerRow {
  distanzKm: number | null;
  dauerMinuten: number | null;
  herzfrequenzDurchschnitt: number | null;
  herzfrequenzMax: number | null;
  hoehenmeter: number | null;
  notiz: string;
}

interface SessionRow {
  uebungId: number;
  uebungName: string;
  typ: UebungTyp;
  zielLabel: string;
  saetze: SatzRow[];
  ausdauerEinheiten: AusdauerRow[];
}

@Component({
  selector: 'app-log-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './log-form.html',
  styleUrl: './log-form.scss'
})
export class LogForm {
  private trainingService = inject(TrainingService);
  private uebungService = inject(UebungService);
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  training = signal<Training | null>(null);
  sessions = signal<SessionRow[]>([]);
  ort = '';

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    const trainingId = Number(this.route.snapshot.paramMap.get('trainingId'));

    forkJoin({
      training: this.trainingService.getOne(trainingId),
      uebungen: this.uebungService.getAll()
    }).subscribe({
      next: ({ training, uebungen }) => {
        this.training.set(training);
        const typById = new Map(uebungen.map((u) => [u.id, u.typ]));

        this.sessions.set(
          training.uebungen.map((pu): SessionRow => {
            const typ = typById.get(pu.uebungId) ?? 'KRAFT';
            const zielTeile: string[] = [];
            if (typ === 'KRAFT' && pu.empfSaetze) zielTeile.push(`${pu.empfSaetze} Sätze`);
            if (typ === 'AUSDAUER' && pu.empfDistanzMeter) zielTeile.push(`${pu.empfDistanzMeter / 1000} km`);
            if (typ === 'AUSDAUER' && pu.empfDauerSekunden) zielTeile.push(`${pu.empfDauerSekunden / 60} min`);

            return {
              uebungId: pu.uebungId,
              uebungName: pu.uebungName ?? '',
              typ,
              zielLabel: zielTeile.length ? `Ziel: ${zielTeile.join(' · ')}` : '',
              saetze: typ === 'KRAFT'
                ? Array.from({ length: Math.max(1, pu.empfSaetze || 1) }, () => this.emptySatz())
                : [],
              ausdauerEinheiten: typ === 'AUSDAUER' ? [this.emptyAusdauer()] : []
            };
          })
        );

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  private emptySatz(): SatzRow {
    return { wiederholungen: null, gewicht: null, dropset: false };
  }

  private emptyAusdauer(): AusdauerRow {
    return {
      distanzKm: null,
      dauerMinuten: null,
      herzfrequenzDurchschnitt: null,
      herzfrequenzMax: null,
      hoehenmeter: null,
      notiz: ''
    };
  }

  addSatz(session: SessionRow): void {
    session.saetze = [...session.saetze, this.emptySatz()];
  }

  removeSatz(session: SessionRow, index: number): void {
    session.saetze = session.saetze.filter((_, i) => i !== index);
  }

  addAusdauer(session: SessionRow): void {
    session.ausdauerEinheiten = [...session.ausdauerEinheiten, this.emptyAusdauer()];
  }

  removeAusdauer(session: SessionRow, index: number): void {
    session.ausdauerEinheiten = session.ausdauerEinheiten.filter((_, i) => i !== index);
  }

  submit(): void {
    this.error.set(null);
    const training = this.training();
    if (!training?.id) return;

    const uebungSessions = this.sessions()
      .map((s) => ({
        uebungId: s.uebungId,
        saetze: s.typ === 'KRAFT'
          ? s.saetze
              .filter((r) => r.wiederholungen !== null)
              .map((r) => ({ wiederholungen: r.wiederholungen as number, gewicht: r.gewicht ?? 0, dropset: r.dropset }))
          : [],
        ausdauerEinheiten: s.typ === 'AUSDAUER'
          ? s.ausdauerEinheiten
              .filter((r) => r.distanzKm !== null || r.dauerMinuten !== null)
              .map((r) => ({
                dauerSekunden: Math.round((r.dauerMinuten ?? 0) * 60),
                distanzMeter: (r.distanzKm ?? 0) * 1000,
                herzfrequenzDurchschnitt: r.herzfrequenzDurchschnitt,
                herzfrequenzMax: r.herzfrequenzMax,
                hoehenmeter: r.hoehenmeter,
                notiz: r.notiz || null
              }))
          : []
      }))
      // Übungen, zu denen nichts eingetragen wurde, gar nicht erst mitschicken —
      // sonst landen leere "Geister-Sessions" ohne Daten in der Datenbank.
      .filter((s) => s.saetze.length > 0 || s.ausdauerEinheiten.length > 0);

    if (uebungSessions.length === 0) {
      this.error.set('Bitte trag mindestens einen Satz oder eine Ausdauer-Einheit ein.');
      return;
    }

    const payload: TrainingAusfuehrung = {
      trainingId: training.id,
      ort: this.ort || null,
      uebungSessions
    };

    this.saving.set(true);
    this.logService.create(payload).subscribe({
      next: (created) => this.router.navigate(['/log', created.id]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Training konnte nicht geloggt werden.'));
      }
    });
  }
}
