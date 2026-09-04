import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';
import { formatDuration } from '../../../core/format-duration';

@Component({
  selector: 'app-log-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './log-detail.html',
  styleUrl: './log-detail.scss'
})
export class LogDetail {
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  log = signal<TrainingAusfuehrung | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.logService.getOne(id).subscribe({
      next: (data) => {
        this.log.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Eintrag konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  formatDuration = formatDuration;

  remove(): void {
    const l = this.log();
    if (!l?.id) return;
    if (!confirm('Diesen geloggten Eintrag wirklich löschen?')) return;

    this.logService.delete(l.id).subscribe({
      next: () => this.router.navigate(['/log']),
      error: (err) => this.error.set(extractErrorMessage(err, 'Eintrag konnte nicht gelöscht werden.'))
    });
  }
}
