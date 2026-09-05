import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SplitService } from '../../../core/services/split.service';
import { Split } from '../../../core/models/split.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-splits-list',
  imports: [RouterLink],
  templateUrl: './splits-list.html',
  styleUrl: './splits-list.scss'
})
export class SplitsList {
  private splitService = inject(SplitService);

  splits = signal<Split[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  bibliothek = signal<Split[]>([]);
  bibliothekOpen = signal(false);
  bibliothekLoading = signal(false);
  addingId = signal<number | null>(null);

  constructor() {
    this.splitService.getAll().subscribe({
      next: (data) => {
        this.splits.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Splits konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  trainingsLabel(split: Split): string {
    return [...split.trainings]
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((t) => t.trainingName)
      .filter(Boolean)
      .join(' → ') || 'Keine Trainings';
  }

  remove(split: Split, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!split.id) return;
    if (!confirm(`Split "${split.name}" wirklich löschen?`)) return;

    this.splitService.delete(split.id).subscribe({
      next: () => this.splits.update((list) => list.filter((s) => s.id !== split.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Split konnte nicht gelöscht werden.'))
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
    this.splitService.getBibliothek().subscribe({
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

  addFromBibliothek(split: Split, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!split.id) return;
    this.addingId.set(split.id);
    this.splitService.addFromBibliothek(split.id).subscribe({
      next: (added) => {
        this.splits.update((list) => [...list, added]);
        this.bibliothek.update((list) => list.filter((s) => s.id !== split.id));
        this.addingId.set(null);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Split konnte nicht hinzugefügt werden.'));
        this.addingId.set(null);
      }
    });
  }
}
