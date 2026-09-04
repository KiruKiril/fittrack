import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UebungService } from '../../core/services/uebung.service';
import { TrainingService } from '../../core/services/training.service';
import { LogService } from '../../core/services/log.service';
import { Training } from '../../core/models/training.model';
import { TrainingAusfuehrung } from '../../core/models/log.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private uebungService = inject(UebungService);
  private trainingService = inject(TrainingService);
  private logService = inject(LogService);

  loading = signal(true);
  uebungenCount = signal(0);
  trainings = signal<Training[]>([]);
  recentLogs = signal<TrainingAusfuehrung[]>([]);

  constructor() {
    forkJoin({
      uebungen: this.uebungService.getAll(),
      trainings: this.trainingService.getAll(),
      logs: this.logService.getAll()
    }).subscribe({
      next: ({ uebungen, trainings, logs }) => {
        this.uebungenCount.set(uebungen.length);
        this.trainings.set(trainings);
        this.recentLogs.set(
          [...logs]
            .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
            .slice(0, 5)
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  sessionTypLabel(log: TrainingAusfuehrung): string {
    const hatKraft = log.uebungSessions.some((s) => s.uebungTyp === 'KRAFT');
    const hatAusdauer = log.uebungSessions.some((s) => s.uebungTyp === 'AUSDAUER');
    if (hatKraft && hatAusdauer) return 'Kraft + Ausdauer';
    return hatAusdauer ? 'Ausdauer' : 'Kraft';
  }
}
