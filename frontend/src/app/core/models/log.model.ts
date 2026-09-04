export interface Satz {
  id?: number;
  wiederholungen: number;
  gewicht: number;
  dropset: boolean;
}

export interface AusdauerEinheit {
  id?: number;
  dauerSekunden: number;
  distanzMeter: number;
  herzfrequenzDurchschnitt?: number | null;
  herzfrequenzMax?: number | null;
  hoehenmeter?: number | null;
  notiz?: string | null;
}

export interface UebungSession {
  id?: number;
  /** null, wenn die Uebung inzwischen geloescht wurde - uebungName bleibt als Snapshot erhalten. */
  uebungId: number | null;
  uebungName?: string;
  uebungTyp?: 'KRAFT' | 'AUSDAUER';
  saetze: Satz[];
  ausdauerEinheiten: AusdauerEinheit[];
}

export interface TrainingAusfuehrung {
  id?: number;
  /** null, wenn der Trainingsplan inzwischen geloescht wurde - trainingName bleibt als Snapshot erhalten. */
  trainingId: number | null;
  trainingName?: string;
  ort?: string | null;
  dauerSekunden?: number | null;
  createdAt?: string;
  uebungSessions: UebungSession[];
}
