export interface TrainingUebung {
  id?: number;
  uebungId: number;
  uebungName?: string;
  empfSaetze?: number;
  empfDistanzMeter?: number | null;
  empfDauerSekunden?: number | null;
}

export interface Training {
  id?: number;
  name: string;
  beschreibung?: string | null;
  createdAt?: string;
  uebungen: TrainingUebung[];
}
