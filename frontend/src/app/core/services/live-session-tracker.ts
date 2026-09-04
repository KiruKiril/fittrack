import { Injectable, signal } from '@angular/core';

export interface ActiveLiveSession {
  trainingId: number;
  trainingName: string;
}

const STORAGE_PREFIX = 'fittrack-live-';

/**
 * Haelt fest, ob gerade ein Live-Training laeuft (gestartet, aber weder beendet noch
 * abgebrochen), damit die Shell ausserhalb der Live-Seite eine "Zurueck zum Training"-
 * Leiste zeigen kann. Beim App-Start wird zusaetzlich localStorage nach einer noch
 * offenen Session durchsucht, damit die Leiste auch nach einem Reload wieder auftaucht.
 */
@Injectable({ providedIn: 'root' })
export class LiveSessionTracker {
  active = signal<ActiveLiveSession | null>(this.findActiveFromStorage());

  start(trainingId: number, trainingName: string): void {
    this.active.set({ trainingId, trainingName });
  }

  clear(): void {
    this.active.set(null);
  }

  private findActiveFromStorage(): ActiveLiveSession | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const state = JSON.parse(raw);
        if (state?.phase && state.phase !== 'done' && state.phase !== 'intro') {
          const trainingId = Number(key.slice(STORAGE_PREFIX.length));
          if (Number.isFinite(trainingId)) {
            return { trainingId, trainingName: state.trainingName ?? 'Training' };
          }
        }
      }
    } catch {
      // localStorage evtl. nicht verfuegbar - dann bleibt die Leiste einfach aus.
    }
    return null;
  }
}
