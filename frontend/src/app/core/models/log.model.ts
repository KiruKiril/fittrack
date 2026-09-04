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
  uebungId: number;
  uebungName?: string;
  uebungTyp?: 'KRAFT' | 'AUSDAUER';
  saetze: Satz[];
  ausdauerEinheiten: AusdauerEinheit[];
}

export interface TrainingAusfuehrung {
  id?: number;
  trainingId: number;
  trainingName?: string;
  ort?: string | null;
  dauerSekunden?: number | null;
  createdAt?: string;
  uebungSessions: UebungSession[];
}
