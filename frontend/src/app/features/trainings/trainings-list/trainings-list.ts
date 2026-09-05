import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainingService } from '../../../core/services/training.service';
import { Training } from '../../../core/models/training.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-trainings-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './trainings-list.html',
  styleUrl: './trainings-list.scss'
})
export class TrainingsList {
  private trainingService = inject(TrainingService);

  trainings = signal<Training[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  bibliothek = signal<Training[]>([]);
  bibliothekOpen = signal(false);
  bibliothekLoading = signal(false);
  addingId = signal<number | null>(null);
  sportartFilter = signal<string>('');

  sportartOptionen = computed(() => {
    const namen = new Set<string>();
    this.bibliothek().forEach((t) => (t.sportarten ?? []).forEach((s) => namen.add(s)));
    return Array.from(namen).sort();
  });

  gefilterteBibliothek = computed(() => {
    const filter = this.sportartFilter();
    if (!filter) return this.bibliothek();
    return this.bibliothek().filter((t) => (t.sportarten ?? []).includes(filter));
  });

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
    const frage = training.bibliothek
      ? `Trainingsplan "${training.name}" aus deinen entfernen?`
      : `Trainingsplan "${training.name}" wirklich löschen?`;
    if (!confirm(frage)) return;

    this.trainingService.delete(training.id).subscribe({
      next: () => this.trainings.update((list) => list.filter((t) => t.id !== training.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht entfernt werden.'))
    });
  }

  toggleBibliothek(): void {
    this.bibliothekOpen.update((v) => !v);
    this.error.set(null);
    if (this.bibliothekOpen()) {
      this.loadBibliothek();
    }
  }

  private loadBibliothek(): void {
    this.bibliothekLoading.set(true);
    this.trainingService.getBibliothek().subscribe({
      next: (data) => {
        this.bibliothek.set(data);
        this.bibliothekLoading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Bibliothek konnte nicht geladen werden.'));
        this.bibliothekLoading.set(false);
      }
    });
  }

  addFromBibliothek(training: Training, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!training.id) return;
    this.addingId.set(training.id);
    this.trainingService.addFromBibliothek(training.id).subscribe({
      next: (added) => {
        this.trainings.update((list) => [...list, added]);
        this.bibliothek.update((list) => list.filter((t) => t.id !== training.id));
        this.addingId.set(null);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainingsplan konnte nicht hinzugefügt werden.'));
        this.addingId.set(null);
      }
    });
  }
}
