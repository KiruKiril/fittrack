import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrainingService } from '../../../core/services/training.service';
import { Training } from '../../../core/models/training.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-trainings-list',
  imports: [RouterLink],
  templateUrl: './trainings-list.html',
  styleUrl: './trainings-list.scss'
})
export class TrainingsList {
  private trainingService = inject(TrainingService);

  trainings = signal<Training[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.trainingService.getAll().subscribe({
      next: (data) => {
        this.trainings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingspläne konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  typenLabel(training: Training): string {
    return training.uebungen.map((u) => u.uebungName).filter(Boolean).join(', ') || 'Keine Übungen';
  }

  remove(training: Training, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!training.id) return;
    if (!confirm(`Trainingsplan "${training.name}" wirklich löschen?`)) return;

    this.trainingService.delete(training.id).subscribe({
      next: () => this.trainings.update((list) => list.filter((t) => t.id !== training.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht gelöscht werden.'))
    });
  }
}
