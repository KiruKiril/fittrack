export type UebungTyp = 'KRAFT' | 'AUSDAUER';

export interface Uebung {
  id?: number;
  name: string;
  typ: UebungTyp;
  beschreibung?: string | null;
  empfWiederholungen?: number;
  createdAt?: string;
  bibliothek?: boolean;
}
