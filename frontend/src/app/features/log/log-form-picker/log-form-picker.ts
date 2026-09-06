import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TrainingService } from '../../../core/services/training.service';
import { UebungService } from '../../../core/services/uebung.service';
import { SplitService } from '../../../core/services/split.service';
import { Training } from '../../../core/models/training.model';
import { Uebung, UebungTyp } from '../../../core/models/uebung.model';
import { extractErrorMessage } from '../../../core/error-message';

type TrainingsTyp = 'Kraft' | 'Ausdauer' | 'Kraft + Ausdauer';
type Modus = 'training' | 'ausdauer';

interface TrainingsGruppe {
  label: TrainingsTyp;
  trainings: Training[];
}

@Component({
  selector: 'app-log-form-picker',
  imports: [FormsModule, RouterLink],
  templateUrl: './log-form-picker.html',
  styleUrl: './log-form-picker.scss'
})
export class LogFormPicker {
  private trainingService = inject(TrainingService);
  private uebungService = inject(UebungService);
  private splitService = inject(SplitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private uebungTypById = new Map<number, UebungTyp>();

  modus = signal<Modus>('training');
  trainings = signal<Training[]>([]);
  ausdauerUebungen = signal<Uebung[]>([]);
  trainingId: number | null = null;
  uebungId: number | null = null;
  datum: string;

  loading = signal(true);
  error = signal<string | null>(null);

  gruppierteTrainings = computed<TrainingsGruppe[]>(() => {
    const gruppen = new Map<TrainingsTyp, Training[]>();
    for (const training of this.trainings()) {
      const typ = this.trainingsTyp(training);
      if (!gruppen.has(typ)) gruppen.set(typ, []);
      gruppen.get(typ)!.push(training);
    }
    const reihenfolge: TrainingsTyp[] = ['Kraft', 'Ausdauer', 'Kraft + Ausdauer'];
    return reihenfolge
      .filter((typ) => gruppen.has(typ))
      .map((typ) => ({ label: typ, trainings: gruppen.get(typ)! }));
  });

  constructor() {
    this.datum = this.route.snapshot.queryParamMap.get('datum') ?? this.today();

    forkJoin({
      trainings: this.trainingService.getAll(),
      uebungen: this.uebungService.getAll(),
      aktiverSplit: this.splitService.getActive()
    }).subscribe({
      next: ({ trainings, uebungen, aktiverSplit }) => {
        this.uebungTypById = new Map(uebungen.map((u) => [u.id!, u.typ]));
        this.ausdauerUebungen.set(uebungen.filter((u) => u.typ === 'AUSDAUER'));
        this.trainings.set(trainings);

        const vorschlagId = aktiverSplit?.naechstesTraining?.trainingId;
        if (vorschlagId && trainings.some((t) => t.id === vorschlagId)) {
          this.trainingId = vorschlagId;
        } else if (trainings.length > 0) {
          this.trainingId = trainings[0].id ?? null;
        }

        if (trainings.length === 0 && this.ausdauerUebungen().length > 0) {
          this.modus.set('ausdauer');
        }
        if (this.ausdauerUebungen().length > 0) {
          this.uebungId = this.ausdauerUebungen()[0].id ?? null;
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Daten konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  /** Grobe Typ-Einordnung eines Trainings anhand seiner Uebungen - analog zu typLabel() in log-history. */
  private trainingsTyp(training: Training): TrainingsTyp {
    const hatKraft = training.uebungen.some((u) => this.uebungTypById.get(u.uebungId) === 'KRAFT');
    const hatAusdauer = training.uebungen.some((u) => this.uebungTypById.get(u.uebungId) === 'AUSDAUER');
    if (hatKraft && hatAusdauer) return 'Kraft + Ausdauer';
    return hatAusdauer ? 'Ausdauer' : 'Kraft';
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  hatAuswahl(): boolean {
    return this.modus() === 'training' ? !!this.trainingId : !!this.uebungId;
  }

  weiter(): void {
    if (this.modus() === 'training') {
      if (!this.trainingId) return;
      this.router.navigate(['/log/neu', this.trainingId], { queryParams: { datum: this.datum } });
    } else {
      if (!this.uebungId) return;
      this.router.navigate(['/log/neu/uebung', this.uebungId], { queryParams: { datum: this.datum } });
    }
  }
}
