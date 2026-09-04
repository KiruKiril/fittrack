import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';

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

  typLabel(log: TrainingAusfuehrung): 'Kraft' | 'Ausdauer' | 'Kraft + Ausdauer' {
    const hatAusdauer = log.uebungSessions.some((s) => s.ausdauerEinheiten.length > 0);
    const hatKraft = log.uebungSessions.some((s) => s.saetze.length > 0);
    if (hatAusdauer && hatKraft) return 'Kraft + Ausdauer';
    return hatAusdauer ? 'Ausdauer' : 'Kraft';
  }
}
