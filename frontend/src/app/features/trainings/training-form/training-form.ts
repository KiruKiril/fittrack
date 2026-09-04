import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../../core/services/training.service';
import { UebungService } from '../../../core/services/uebung.service';
import { Uebung } from '../../../core/models/uebung.model';
import { TrainingUebung } from '../../../core/models/training.model';
import { extractErrorMessage } from '../../../core/error-message';
import { PauseDial } from '../../../shared/pause-dial/pause-dial';

interface PlanRow {
  uebungId: number | null;
  empfSaetze: number;
  empfDistanzKm: number | null;
  empfDauerMinuten: number | null;
  pauseEditOpen: boolean;
  pauseSaetzeOverride: number | null;
  pauseNachUebungOverride: number | null;
}

@Component({
  selector: 'app-training-form',
  imports: [FormsModule, RouterLink, PauseDial],
  templateUrl: './training-form.html',
  styleUrl: './training-form.scss'
})
export class TrainingForm {
  private trainingService = inject(TrainingService);
  private uebungService = inject(UebungService);
  private router = inject(Router);

  name = '';
  beschreibung = '';
  pauseSaetze = 90;
  pauseUebungen = 120;
  rows: PlanRow[] = [this.emptyRow()];

  uebungen = signal<Uebung[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.uebungService.getAll().subscribe({
      next: (data) => {
        this.uebungen.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Übungen konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  private emptyRow(): PlanRow {
    return {
      uebungId: null,
      empfSaetze: 3,
      empfDistanzKm: null,
      empfDauerMinuten: null,
      pauseEditOpen: false,
      pauseSaetzeOverride: null,
      pauseNachUebungOverride: null
    };
  }

  typOf(uebungId: number | null): 'KRAFT' | 'AUSDAUER' | null {
    if (uebungId === null) return null;
    return this.uebungen().find((u) => u.id === uebungId)?.typ ?? null;
  }

  addRow(): void {
    this.rows = [...this.rows, this.emptyRow()];
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  togglePauseEdit(row: PlanRow): void {
    if (!row.pauseEditOpen) {
      // Beim Oeffnen mit dem aktuellen Standard vorbefuellen, statt bei 0 zu starten.
      if (row.pauseSaetzeOverride === null) row.pauseSaetzeOverride = this.pauseSaetze;
      if (row.pauseNachUebungOverride === null) row.pauseNachUebungOverride = this.pauseUebungen;
    }
    row.pauseEditOpen = !row.pauseEditOpen;
  }

  submit(): void {
    this.error.set(null);

    if (!this.name.trim()) {
      this.error.set('Bitte einen Namen für den Trainingsplan angeben.');
      return;
    }

    const gueltigeRows = this.rows.filter((r) => r.uebungId !== null);
    if (gueltigeRows.length === 0) {
      this.error.set('Bitte mindestens eine Übung auswählen.');
      return;
    }

    const uebungen: TrainingUebung[] = gueltigeRows.map((r) => {
      const typ = this.typOf(r.uebungId);
      return {
        uebungId: r.uebungId as number,
        empfSaetze: typ === 'KRAFT' ? (r.empfSaetze || 0) : 0,
        empfDistanzMeter: typ === 'AUSDAUER' && r.empfDistanzKm ? r.empfDistanzKm * 1000 : null,
        empfDauerSekunden: typ === 'AUSDAUER' && r.empfDauerMinuten ? Math.round(r.empfDauerMinuten * 60) : null,
        pauseZwischenSaetzenSekunden: typ === 'KRAFT' ? r.pauseSaetzeOverride : null,
        pauseNachUebungSekunden: r.pauseNachUebungOverride
      };
    });

    this.saving.set(true);
    this.trainingService.create({
      name: this.name,
      beschreibung: this.beschreibung || undefined,
      defaultPauseZwischenSaetzenSekunden: this.pauseSaetze,
      defaultPauseZwischenUebungenSekunden: this.pauseUebungen,
      uebungen
    }).subscribe({
      next: (created) => this.router.navigate(['/trainings', created.id]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht angelegt werden.'));
      }
    });
  }
}
