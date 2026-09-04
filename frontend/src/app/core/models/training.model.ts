export interface TrainingUebung {
  id?: number;
  uebungId: number;
  uebungName?: string;
  empfSaetze?: number;
  empfDistanzMeter?: number | null;
  empfDauerSekunden?: number | null;
  pauseZwischenSaetzenSekunden?: number | null;
  pauseNachUebungSekunden?: number | null;
}

export interface Training {
  id?: number;
  name: string;
  beschreibung?: string | null;
  defaultPauseZwischenSaetzenSekunden: number;
  defaultPauseZwischenUebungenSekunden: number;
  createdAt?: string;
  uebungen: TrainingUebung[];
}
