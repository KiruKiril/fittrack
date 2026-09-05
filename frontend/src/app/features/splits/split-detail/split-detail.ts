import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SplitService } from '../../../core/services/split.service';
import { Split } from '../../../core/models/split.model';
import { extractErrorMessage } from '../../../core/error-message';

@Component({
  selector: 'app-split-detail',
  imports: [RouterLink],
  templateUrl: './split-detail.html',
  styleUrl: './split-detail.scss'
})
export class SplitDetail {
  private splitService = inject(SplitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  split = signal<Split | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  advancing = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.splitService.getOne(id).subscribe({
      next: (data) => {
        this.split.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Split konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  sortedTrainings(split: Split) {
    return [...split.trainings].sort((a, b) => a.reihenfolge - b.reihenfolge);
  }

  isNext(split: Split, trainingEintragId: number | undefined): boolean {
    return !!trainingEintragId && split.naechstesTraining?.id === trainingEintragId;
  }

  advance(): void {
    const s = this.split();
    if (!s?.id) return;
    this.advancing.set(true);
    this.splitService.advance(s.id).subscribe({
      next: (updated) => {
        this.split.set(updated);
        this.advancing.set(false);
      },
      error: (err) => {
        this.advancing.set(false);
        this.error.set(extractErrorMessage(err, 'Konnte nicht weiterspringen.'));
      }
    });
  }

  remove(): void {
    const s = this.split();
    if (!s?.id) return;
    if (!confirm(`Split "${s.name}" wirklich löschen?`)) return;

    this.splitService.delete(s.id).subscribe({
      next: () => this.router.navigate(['/splits']),
      error: (err) => this.error.set(extractErrorMessage(err, 'Split konnte nicht gelöscht werden.'))
    });
  }
}
