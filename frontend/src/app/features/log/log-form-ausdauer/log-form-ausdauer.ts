import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UebungService } from '../../../core/services/uebung.service';
import { LogService } from '../../../core/services/log.service';
import { Uebung } from '../../../core/models/uebung.model';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';

interface AusdauerRow {
  distanzKm: number | null;
  dauerMinuten: number | null;
  herzfrequenzDurchschnitt: number | null;
  herzfrequenzMax: number | null;
  hoehenmeter: number | null;
  notiz: string;
}

@Component({
  selector: 'app-log-form-ausdauer',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './log-form-ausdauer.html',
  styleUrl: './log-form-ausdauer.scss'
})
export class LogFormAusdauer {
  private uebungService = inject(UebungService);
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  uebung = signal<Uebung | null>(null);
  einheiten = signal<AusdauerRow[]>([this.emptyEinheit()]);
  ort = '';
  datum: string | null = null;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    const uebungId = Number(this.route.snapshot.paramMap.get('uebungId'));
    this.datum = this.route.snapshot.queryParamMap.get('datum');

    this.uebungService.getAll().subscribe({
      next: (uebungen) => {
        const gefunden = uebungen.find((u) => u.id === uebungId) ?? null;
        if (!gefunden) {
          this.error.set('Übung nicht gefunden.');
        } else if (gefunden.typ !== 'AUSDAUER') {
          this.error.set('Diese Übung ist keine Ausdauer-Übung.');
        } else {
          this.uebung.set(gefunden);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Übung konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  private emptyEinheit(): AusdauerRow {
    return {
      distanzKm: null,
      dauerMinuten: null,
      herzfrequenzDurchschnitt: null,
      herzfrequenzMax: null,
      hoehenmeter: null,
      notiz: ''
    };
  }

  addEinheit(): void {
    this.einheiten.update((list) => [...list, this.emptyEinheit()]);
  }

  removeEinheit(index: number): void {
    this.einheiten.update((list) => list.filter((_, i) => i !== index));
  }

  submit(): void {
    this.error.set(null);
    const uebung = this.uebung();
    if (!uebung?.id) return;

    const ausdauerEinheiten = this.einheiten()
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
      }));

    if (ausdauerEinheiten.length === 0) {
      this.error.set('Bitte trag mindestens eine Ausdauer-Einheit ein.');
      return;
    }

    const payload: TrainingAusfuehrung = {
      trainingId: null,
      ort: this.ort || null,
      datum: this.datum,
      uebungSessions: [
        {
          uebungId: uebung.id,
          saetze: [],
          ausdauerEinheiten
        }
      ]
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
