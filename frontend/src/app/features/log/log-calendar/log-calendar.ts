import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { TrainingAusfuehrung } from '../../../core/models/log.model';
import { extractErrorMessage } from '../../../core/error-message';

interface DayCell {
  key: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  logs: TrainingAusfuehrung[];
}

const WOCHENTAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

@Component({
  selector: 'app-log-calendar',
  imports: [RouterLink],
  templateUrl: './log-calendar.html',
  styleUrl: './log-calendar.scss'
})
export class LogCalendar {
  private logService = inject(LogService);

  logs = signal<TrainingAusfuehrung[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  viewMonth = signal<Date>(this.startOfMonth(new Date()));

  wochentageKurz = WOCHENTAGE_KURZ;

  constructor() {
    this.logService.getAll().subscribe({
      next: (data) => {
        this.logs.set(data);
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

    const todayKey = this.toKey(new Date());
    const byDay = this.logsByDay();

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toKey(date);
      cells.push({
        key,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === monthIndex,
        isToday: key === todayKey,
        logs: byDay.get(key) ?? []
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
}
