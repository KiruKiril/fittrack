import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../../core/services/training.service';
import { Training } from '../../../core/models/training.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-training-detail',
  imports: [RouterLink],
  templateUrl: './training-detail.html',
  styleUrl: './training-detail.scss'
})
export class TrainingDetail {
  private trainingService = inject(TrainingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  training = signal<Training | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.trainingService.getOne(id).subscribe({
      next: (data) => {
        this.training.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  remove(): void {
    const t = this.training();
    if (!t?.id) return;
    if (!confirm(`Trainingsplan "${t.name}" wirklich löschen?`)) return;

    this.trainingService.delete(t.id).subscribe({
      next: () => this.router.navigate(['/trainings']),
      error: (err) => this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht gelöscht werden.'))
    });
  }
}
