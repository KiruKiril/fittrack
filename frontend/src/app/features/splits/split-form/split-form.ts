import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SplitService } from '../../../core/services/split.service';
import { TrainingService } from '../../../core/services/training.service';
import { Training } from '../../../core/models/training.model';
import { SplitTraining, Wochentag, WOCHENTAGE } from '../../../core/models/split.model';
import { extractErrorMessage } from '../../../core/error-message';

interface PlanRow {
  trainingId: number | null;
  wochentag: Wochentag | '';
}

@Component({
  selector: 'app-split-form',
  imports: [FormsModule, RouterLink, DragDropModule],
  templateUrl: './split-form.html',
  styleUrl: './split-form.scss'
})
export class SplitForm {
  private splitService = inject(SplitService);
  private trainingService = inject(TrainingService);
  private router = inject(Router);

  wochentage = WOCHENTAGE;

  name = '';
  beschreibung = '';
  rows: PlanRow[] = [this.emptyRow()];

  trainings = signal<Training[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.trainingService.getAll().subscribe({
      next: (data) => {
        this.trainings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Trainings konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  private emptyRow(): PlanRow {
    return { trainingId: null, wochentag: '' };
  }

  addRow(): void {
    this.rows = [...this.rows, this.emptyRow()];
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const rows = [...this.rows];
    [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]];
    this.rows = rows;
  }

  moveDown(index: number): void {
    if (index === this.rows.length - 1) return;
    const rows = [...this.rows];
    [rows[index], rows[index + 1]] = [rows[index + 1], rows[index]];
    this.rows = rows;
  }

  /** Umsortieren per Drag-and-Drop (Grip-Handle pro Zeile) - die ↑/↓-Buttons bleiben zusaetzlich
   *  als tastatur-/screenreader-zugaengliche Alternative bestehen. */
  drop(event: CdkDragDrop<PlanRow[]>): void {
    const rows = [...this.rows];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.rows = rows;
  }

  submit(): void {
    this.error.set(null);

    if (!this.name.trim()) {
      this.error.set('Bitte einen Namen für den Split angeben.');
      return;
    }

    const gueltigeRows = this.rows.filter((r) => r.trainingId !== null);
    if (gueltigeRows.length === 0) {
      this.error.set('Bitte mindestens ein Training auswählen.');
      return;
    }

    const trainings: SplitTraining[] = gueltigeRows.map((r, i) => ({
      trainingId: r.trainingId as number,
      reihenfolge: i + 1,
      wochentag: r.wochentag || null
    }));

    this.saving.set(true);
    this.splitService.create({
      name: this.name,
      beschreibung: this.beschreibung || undefined,
      trainings
    }).subscribe({
      next: (created) => this.router.navigate(['/splits', created.id]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Split konnte nicht angelegt werden.'));
      }
    });
  }
}
