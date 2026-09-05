export type Wochentag = 'MONTAG' | 'DIENSTAG' | 'MITTWOCH' | 'DONNERSTAG' | 'FREITAG' | 'SAMSTAG' | 'SONNTAG';

export const WOCHENTAGE: { value: Wochentag; label: string }[] = [
  { value: 'MONTAG', label: 'Montag' },
  { value: 'DIENSTAG', label: 'Dienstag' },
  { value: 'MITTWOCH', label: 'Mittwoch' },
  { value: 'DONNERSTAG', label: 'Donnerstag' },
  { value: 'FREITAG', label: 'Freitag' },
  { value: 'SAMSTAG', label: 'Samstag' },
  { value: 'SONNTAG', label: 'Sonntag' }
];

export interface SplitTraining {
  id?: number;
  trainingId: number;
  trainingName?: string;
  reihenfolge: number;
  wochentag?: Wochentag | null;
}

export interface Split {
  id?: number;
  name: string;
  beschreibung?: string | null;
  bibliothek?: boolean;
  aktuellerIndex?: number;
  naechstesTraining?: SplitTraining | null;
  createdAt?: string;
  trainings: SplitTraining[];
  sportarten?: string[];
}
