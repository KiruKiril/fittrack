import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';
import { formatDuration } from '../../../core/format-duration';

@Component({
  selector: 'app-log-history',
  imports: [RouterLink, DatePipe],
  templateUrl: './log-history.html',
  styleUrl: './log-history.scss'
})
export class LogHistory {
  private logService = inject(LogService);

  logs = signal<TrainingAusfuehrung[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.logService.getAll().subscribe({
      next: (data) => {
        this.logs.set([...data].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Verlauf konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  formatDuration = formatDuration;

  typLabel(log: TrainingAusfuehrung): 'Kraft' | 'Ausdauer' | 'Kraft + Ausdauer' {
    const hatKraft = log.uebungSessions.some((s) => s.uebungTyp === 'KRAFT');
    const hatAusdauer = log.uebungSessions.some((s) => s.uebungTyp === 'AUSDAUER');
    if (hatKraft && hatAusdauer) return 'Kraft + Ausdauer';
    return hatAusdauer ? 'Ausdauer' : 'Kraft';
  }

  remove(log: TrainingAusfuehrung, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!log.id) return;
    if (!confirm(`Eintrag "${log.trainingName}" wirklich löschen?`)) return;

    this.logService.delete(log.id).subscribe({
      next: () => this.logs.update((list) => list.filter((l) => l.id !== log.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Eintrag konnte nicht gelöscht werden.'))
    });
  }
}
