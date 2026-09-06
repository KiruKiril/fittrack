import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TrainingService } from '../../../core/services/training.service';
import { SplitService } from '../../../core/services/split.service';
import { Training } from '../../../core/models/training.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-log-form-picker',
  imports: [FormsModule, RouterLink],
  templateUrl: './log-form-picker.html',
  styleUrl: './log-form-picker.scss'
})
export class LogFormPicker {
  private trainingService = inject(TrainingService);
  private splitService = inject(SplitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  trainings = signal<Training[]>([]);
  trainingId: number | null = null;
  datum: string;

  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.datum = this.route.snapshot.queryParamMap.get('datum') ?? this.today();

    forkJoin({
      trainings: this.trainingService.getAll(),
      aktiverSplit: this.splitService.getActive()
    }).subscribe({
      next: ({ trainings, aktiverSplit }) => {
        this.trainings.set(trainings);
        const vorschlagId = aktiverSplit?.naechstesTraining?.trainingId;
        if (vorschlagId && trainings.some((t) => t.id === vorschlagId)) {
          this.trainingId = vorschlagId;
        } else if (trainings.length > 0) {
          this.trainingId = trainings[0].id ?? null;
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingspläne konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  weiter(): void {
    if (!this.trainingId) return;
    this.router.navigate(['/log/neu', this.trainingId], { queryParams: { datum: this.datum } });
  }
}
