import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LogService } from '../../core/services/log.service';
import { UebungService } from '../../core/services/uebung.service';
import { TrainingAusfuehrung } from '../../core/models/log.model';
import { Uebung } from '../../core/models/uebung.model';
import { extractErrorMessage } from '../../core/error-message';

type Modus = 'uebung' | 'woche';

interface SatzEintrag {
  datum: string;
  wiederholungen: number;
  gewicht: number;
}

interface SessionAggregat {
  datum: string;
  bestGewicht: number;
  volumen: number;
}

interface ChartPoint {
  x: number;
  y: number;
  wert: number;
}

interface Chart {
  path: string;
  points: ChartPoint[];
}

interface WeekRow {
  key: string;
  label: string;
  volumen: number;
  einheiten: number;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const CHART_PADDING = 12;
const WOCHEN_ANZAHL = 8;

@Component({
  selector: 'app-fortschritt',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './fortschritt.html',
  styleUrl: './fortschritt.scss'
})
export class Fortschritt {
  private logService = inject(LogService);
  private uebungService = inject(UebungService);

  logs = signal<TrainingAusfuehrung[]>([]);
  kraftUebungen = signal<Uebung[]>([]);
  /** Signal statt einfachem Feld, damit die abgeleiteten computed()-Werte auf den Dropdown-Wechsel reagieren. */
  uebungId = signal<number | null>(null);

  modus = signal<Modus>('uebung');
  loading = signal(true);
  error = signal<string | null>(null);

  readonly chartWidth = CHART_WIDTH;
  readonly chartHeight = CHART_HEIGHT;

  constructor() {
    forkJoin({
      logs: this.logService.getAll(),
      uebungen: this.uebungService.getAll()
    }).subscribe({
      next: ({ logs, uebungen }) => {
        this.logs.set(logs);
        const kraft = uebungen.filter((u) => u.typ === 'KRAFT');
        this.kraftUebungen.set(kraft);
        if (kraft.length > 0) this.uebungId.set(kraft[0].id ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Daten konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  /** Alle Saetze der ausgewaehlten Uebung, chronologisch (ISO-Datumsstrings sortieren korrekt als String). */
  private saetzeFuerUebung = computed<SatzEintrag[]>(() => {
    const id = this.uebungId();
    if (id === null) return [];

    const result: SatzEintrag[] = [];
    for (const log of this.logs()) {
      if (!log.createdAt) continue;
      for (const session of log.uebungSessions) {
        if (session.uebungId !== id) continue;
        for (const satz of session.saetze) {
          result.push({ datum: log.createdAt, wiederholungen: satz.wiederholungen, gewicht: satz.gewicht });
        }
      }
    }
    return result.sort((a, b) => a.datum.localeCompare(b.datum));
  });

  /** Pro Trainingseinheit das schwerste Satzgewicht und das Gesamtvolumen dieser Uebung. */
  private sessionsFuerUebung = computed<SessionAggregat[]>(() => {
    const map = new Map<string, SessionAggregat>();
    for (const eintrag of this.saetzeFuerUebung()) {
      const bestehend = map.get(eintrag.datum) ?? { datum: eintrag.datum, bestGewicht: 0, volumen: 0 };
      bestehend.bestGewicht = Math.max(bestehend.bestGewicht, eintrag.gewicht);
      bestehend.volumen += eintrag.wiederholungen * eintrag.gewicht;
      map.set(eintrag.datum, bestehend);
    }
    return Array.from(map.values()).sort((a, b) => a.datum.localeCompare(b.datum));
  });

  hatVerlauf = computed(() => this.sessionsFuerUebung().length > 0);

  gewichtChart = computed<Chart>(() => this.buildChart(this.sessionsFuerUebung().map((s) => s.bestGewicht)));
  volumenChart = computed<Chart>(() => this.buildChart(this.sessionsFuerUebung().map((s) => s.volumen)));

  ersterTermin = computed(() => {
    const sessions = this.sessionsFuerUebung();
    return sessions.length > 0 ? this.formatKurz(sessions[0].datum) : '';
  });

  letzterTermin = computed(() => {
    const sessions = this.sessionsFuerUebung();
    return sessions.length > 0 ? this.formatKurz(sessions[sessions.length - 1].datum) : '';
  });

  bestesGewicht = computed<SatzEintrag | null>(() => {
    const saetze = this.saetzeFuerUebung();
    if (saetze.length === 0) return null;
    return saetze.reduce((best, s) => (s.gewicht > best.gewicht ? s : best), saetze[0]);
  });

  meisteWiederholungen = computed<SatzEintrag | null>(() => {
    const saetze = this.saetzeFuerUebung();
    if (saetze.length === 0) return null;
    return saetze.reduce((best, s) => (s.wiederholungen > best.wiederholungen ? s : best), saetze[0]);
  });

  formatDatumLang(iso: string): string {
    const [datum] = iso.split('T');
    const [jahr, monat, tag] = datum.split('-');
    return `${tag}.${monat}.${jahr}`;
  }

  private formatKurz(iso: string): string {
    const [datum] = iso.split('T');
    const [, monat, tag] = datum.split('-');
    return `${tag}.${monat}`;
  }

  private buildChart(werte: number[]): Chart {
    if (werte.length === 0) return { path: '', points: [] };

    const min = Math.min(...werte, 0);
    const max = Math.max(...werte, 1);
    const spanne = max - min || 1;
    const innerW = CHART_WIDTH - CHART_PADDING * 2;
    const innerH = CHART_HEIGHT - CHART_PADDING * 2;

    const points: ChartPoint[] = werte.map((wert, i) => {
      const x = werte.length === 1
        ? CHART_PADDING + innerW / 2
        : CHART_PADDING + (innerW * i) / (werte.length - 1);
      const y = CHART_PADDING + innerH - ((wert - min) / spanne) * innerH;
      return { x, y, wert };
    });

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { path, points };
  }

  /** Letzte WOCHEN_ANZAHL Kalenderwochen (Montag-Start), aelteste zuerst - inkl. Wochen ohne Training (0). */
  wochen = computed<WeekRow[]>(() => {
    const heute = new Date();
    const heuteMontag = this.montagVon(heute.getFullYear(), heute.getMonth() + 1, heute.getDate());

    const rows: WeekRow[] = [];
    for (let i = WOCHEN_ANZAHL - 1; i >= 0; i--) {
      const montag = new Date(heuteMontag.getFullYear(), heuteMontag.getMonth(), heuteMontag.getDate() - i * 7);
      const sonntag = new Date(montag.getFullYear(), montag.getMonth(), montag.getDate() + 6);
      rows.push({
        key: this.toKey(montag),
        label: `${this.formatTag(montag)}–${this.formatTag(sonntag)}`,
        volumen: 0,
        einheiten: 0
      });
    }

    const byKey = new Map(rows.map((r) => [r.key, r]));

    for (const log of this.logs()) {
      if (!log.createdAt) continue;
      const [jahr, monat, tag] = log.createdAt.split('T')[0].split('-').map(Number);
      const montag = this.montagVon(jahr, monat, tag);
      const row = byKey.get(this.toKey(montag));
      if (!row) continue;

      row.einheiten += 1;
      for (const session of log.uebungSessions) {
        if (session.uebungTyp !== 'KRAFT') continue;
        for (const satz of session.saetze) {
          row.volumen += satz.wiederholungen * satz.gewicht;
        }
      }
    }

    return rows;
  });

  wochenChart = computed<Chart>(() => this.buildChart(this.wochen().map((w) => w.volumen)));

  /** Montag der Kalenderwoche zu einem gegebenen Datum, ohne Date-String-Parsing (Zeitzonen-sicher). */
  private montagVon(jahr: number, monat: number, tag: number): Date {
    const d = new Date(jahr, monat - 1, tag);
    const wochentag = (d.getDay() + 6) % 7; // 0 = Montag
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - wochentag);
  }

  private toKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private formatTag(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
