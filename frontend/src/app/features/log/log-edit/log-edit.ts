import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
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
  saetze: SatzRow[];
  ausdauerEinheiten: AusdauerRow[];
}

@Component({
  selector: 'app-log-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './log-edit.html',
  styleUrl: './log-edit.scss'
})
export class LogEdit {
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  logId = Number(this.route.snapshot.paramMap.get('id'));

  trainingName = '';
  ort = '';
  sessions = signal<SessionRow[]>([]);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.logService.getOne(this.logId).subscribe({
      next: (log) => {
        this.trainingName = log.trainingName ?? '';
        this.ort = log.ort ?? '';
        this.sessions.set(
          log.uebungSessions.map((s): SessionRow => ({
            uebungId: s.uebungId,
            uebungName: s.uebungName ?? '',
            typ: s.uebungTyp ?? 'KRAFT',
            saetze: s.saetze.map((satz) => ({
              wiederholungen: satz.wiederholungen,
              gewicht: satz.gewicht,
              dropset: satz.dropset
            })),
            ausdauerEinheiten: s.ausdauerEinheiten.map((e) => ({
              distanzKm: e.distanzMeter / 1000,
              dauerMinuten: e.dauerSekunden / 60,
              herzfrequenzDurchschnitt: e.herzfrequenzDurchschnitt ?? null,
              herzfrequenzMax: e.herzfrequenzMax ?? null,
              hoehenmeter: e.hoehenmeter ?? null,
              notiz: e.notiz ?? ''
            }))
          }))
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Eintrag konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  addSatz(session: SessionRow): void {
    session.saetze = [...session.saetze, { wiederholungen: null, gewicht: null, dropset: false }];
  }

  removeSatz(session: SessionRow, index: number): void {
    session.saetze = session.saetze.filter((_, i) => i !== index);
  }

  addAusdauer(session: SessionRow): void {
    session.ausdauerEinheiten = [
      ...session.ausdauerEinheiten,
      { distanzKm: null, dauerMinuten: null, herzfrequenzDurchschnitt: null, herzfrequenzMax: null, hoehenmeter: null, notiz: '' }
    ];
  }

  removeAusdauer(session: SessionRow, index: number): void {
    session.ausdauerEinheiten = session.ausdauerEinheiten.filter((_, i) => i !== index);
  }

  submit(): void {
    this.error.set(null);

    const uebungSessions = this.sessions()
      .map((s) => ({
        uebungId: s.uebungId,
        saetze: s.typ === 'KRAFT'
          ? s.saetze
              .filter((r) => r.wiederholungen !== null || r.gewicht !== null || r.dropset)
              .map((r) => ({ wiederholungen: r.wiederholungen ?? 0, gewicht: r.gewicht ?? 0, dropset: r.dropset }))
          : [],
        ausdauerEinheiten: s.typ === 'AUSDAUER'
          ? s.ausdauerEinheiten
              .filter((r) =>
                r.distanzKm !== null ||
                r.dauerMinuten !== null ||
                r.herzfrequenzDurchschnitt !== null ||
                r.herzfrequenzMax !== null ||
                r.hoehenmeter !== null ||
                r.notiz.trim() !== ''
              )
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
      .filter((s) => s.saetze.length > 0 || s.ausdauerEinheiten.length > 0);

    if (uebungSessions.length === 0) {
      this.error.set('Bitte trag mindestens einen Satz oder eine Ausdauer-Einheit ein.');
      return;
    }

    const payload: TrainingAusfuehrung = {
      trainingId: 0,
      ort: this.ort || null,
      uebungSessions
    };

    this.saving.set(true);
    this.logService.update(this.logId, payload).subscribe({
      next: () => this.router.navigate(['/log', this.logId]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Änderungen konnten nicht gespeichert werden.'));
      }
    });
  }
}
