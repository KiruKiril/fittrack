import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LogService } from '../../../core/services/log.service';
import { TrainingService } from '../../../core/services/training.service';
import { SplitService } from '../../../core/services/split.service';
import { TagesplanungService } from '../../../core/services/tagesplanung.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { Training } from '../../../core/models/training.model';
import { Tagesplanung } from '../../../core/models/tagesplanung.model';
import { extractErrorMessage } from '../../../core/error-message';

interface DayCell {
  key: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  logs: TrainingAusfuehrung[];
  /** true = innerhalb des Planungshorizonts (heute bis heute + Horizont-Wochen). */
  planbar: boolean;
  /** Explizit fuer diesen Tag geplantes Training (falls vorhanden). */
  geplanteTrainingId: number | null;
  /** Automatischer Vorschlag aus der Rotation des aktiven Splits, solange keine explizite Planung existiert. */
  vorschlagTrainingId: number | null;
}

const WOCHENTAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

@Component({
  selector: 'app-log-calendar',
  imports: [RouterLink, FormsModule],
  templateUrl: './log-calendar.html',
  styleUrl: './log-calendar.scss'
})
export class LogCalendar {
  private logService = inject(LogService);
  private trainingService = inject(TrainingService);
  private splitService = inject(SplitService);
  private tagesplanungService = inject(TagesplanungService);
  private userPreferencesService = inject(UserPreferencesService);

  logs = signal<TrainingAusfuehrung[]>([]);
  trainings = signal<Training[]>([]);
  planungen = signal<Tagesplanung[]>([]);
  rotationTrainingIds = signal<number[]>([]);
  rotationStartIndex = signal(0);
  horizontWochen = signal(2);

  loading = signal(true);
  error = signal<string | null>(null);
  savingDay = signal<string | null>(null);
  viewMonth = signal<Date>(this.startOfMonth(new Date()));

  wochentageKurz = WOCHENTAGE_KURZ;

  constructor() {
    forkJoin({
      logs: this.logService.getAll(),
      trainings: this.trainingService.getAll(),
      planungen: this.tagesplanungService.getAll(),
      praeferenzen: this.userPreferencesService.get(),
      aktiverSplit: this.splitService.getActive()
    }).subscribe({
      next: ({ logs, trainings, planungen, praeferenzen, aktiverSplit }) => {
        this.logs.set(logs);
        this.trainings.set(trainings);
        this.planungen.set(planungen);
        this.horizontWochen.set(praeferenzen.planungshorizontWochen);

        if (aktiverSplit && aktiverSplit.trainings.length > 0) {
          const sortiert = [...aktiverSplit.trainings].sort((a, b) => a.reihenfolge - b.reihenfolge);
          this.rotationTrainingIds.set(sortiert.map((t) => t.trainingId));
          this.rotationStartIndex.set(aktiverSplit.aktuellerIndex ?? 0);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Verlauf konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  monthLabel = computed(() => {
    const m = this.viewMonth();
    return `${MONATSNAMEN[m.getMonth()]} ${m.getFullYear()}`;
  });

  /** Gruppiert alle Logs nach Kalendertag (YYYY-MM-DD, aus dem lokalen createdAt-Zeitstempel
   *  direkt als String-Praefix extrahiert - vermeidet Zeitzonen-Stolperfallen von Date-Objekten). */
  private logsByDay = computed(() => {
    const map = new Map<string, TrainingAusfuehrung[]>();
    for (const log of this.logs()) {
      if (!log.createdAt) continue;
      const key = log.createdAt.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    }
    return map;
  });

  private planungByDay = computed(() => {
    const map = new Map<string, Tagesplanung>();
    for (const p of this.planungen()) {
      map.set(p.datum, p);
    }
    return map;
  });

  /** 6 volle Wochen (Montag-Start) rund um den angezeigten Monat, inkl. grau dargestellter
   *  Tage aus dem Vor-/Folgemonat zum Auffuellen der ersten/letzten Woche. */
  weeks = computed<DayCell[][]>(() => {
    const month = this.viewMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    // JS Date.getDay(): 0=Sonntag..6=Samstag - wir wollen Montag als ersten Wochentag.
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, monthIndex, 1 - firstWeekday);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = this.toKey(today);
    const maxPlanDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + this.horizontWochen() * 7);

    const byDay = this.logsByDay();
    const byPlan = this.planungByDay();
    const rotation = this.rotationTrainingIds();

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toKey(date);
      const planbar = date >= today && date <= maxPlanDate;

      let vorschlagTrainingId: number | null = null;
      if (planbar && rotation.length > 0) {
        const diffTage = Math.round((date.getTime() - today.getTime()) / 86400000);
        const index = (this.rotationStartIndex() + diffTage) % rotation.length;
        vorschlagTrainingId = rotation[index];
      }

      cells.push({
        key,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === monthIndex,
        isToday: key === todayKey,
        logs: byDay.get(key) ?? [],
        planbar,
        geplanteTrainingId: byPlan.get(key)?.trainingId ?? null,
        vorschlagTrainingId
      });
    }

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  });

  private toKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  previousMonth(): void {
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.viewMonth.set(this.startOfMonth(new Date()));
  }

  planTraining(day: DayCell, trainingId: number | null): void {
    if (trainingId === null) {
      if (day.geplanteTrainingId !== null) {
        this.resetPlanung(day);
      }
      return;
    }

    this.savingDay.set(day.key);
    this.tagesplanungService.set(day.key, trainingId).subscribe({
      next: (planung) => {
        this.planungen.update((list) => [...list.filter((p) => p.datum !== day.key), planung]);
        this.savingDay.set(null);
      },
      error: (err) => {
        this.savingDay.set(null);
        this.error.set(extractErrorMessage(err, 'Planung konnte nicht gespeichert werden.'));
      }
    });
  }

  resetPlanung(day: DayCell): void {
    this.savingDay.set(day.key);
    this.tagesplanungService.delete(day.key).subscribe({
      next: () => {
        this.planungen.update((list) => list.filter((p) => p.datum !== day.key));
        this.savingDay.set(null);
      },
      error: (err) => {
        this.savingDay.set(null);
        this.error.set(extractErrorMessage(err, 'Planung konnte nicht zurückgesetzt werden.'));
      }
    });
  }
}
