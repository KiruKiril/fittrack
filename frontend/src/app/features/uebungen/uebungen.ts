import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UebungService } from '../../core/services/uebung.service';
import { Uebung, UebungTyp } from '../../core/models/uebung.model';
import { extractErrorMessage } from '../../core/error-message';

@Component({
  selector: 'app-uebungen',
  imports: [ReactiveFormsModule],
  templateUrl: './uebungen.html',
  styleUrl: './uebungen.scss'
})
export class Uebungen {
  private uebungService = inject(UebungService);
  private fb = inject(FormBuilder);

  uebungen = signal<Uebung[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  formOpen = signal(false);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    typ: ['KRAFT' as UebungTyp, Validators.required],
    beschreibung: [''],
    empfWiederholungen: [8]
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.uebungService.getAll().subscribe({
      next: (data) => {
        this.uebungen.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Übungen konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  kraftUebungen(): Uebung[] {
    return this.uebungen().filter((u) => u.typ === 'KRAFT');
  }

  ausdauerUebungen(): Uebung[] {
    return this.uebungen().filter((u) => u.typ === 'AUSDAUER');
  }

  toggleForm(): void {
    this.formOpen.update((v) => !v);
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Bitte einen Namen für die Übung angeben.');
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload: Uebung = {
      name: value.name,
      typ: value.typ,
      beschreibung: value.beschreibung || undefined,
      empfWiederholungen: value.typ === 'KRAFT' ? value.empfWiederholungen : undefined
    };

    this.uebungService.create(payload).subscribe({
      next: (created) => {
        this.uebungen.update((list) => [...list, created]);
        this.saving.set(false);
        this.formOpen.set(false);
        this.form.reset({ name: '', typ: 'KRAFT', beschreibung: '', empfWiederholungen: 8 });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Übung konnte nicht angelegt werden.'));
      }
    });
  }

  remove(uebung: Uebung): void {
    if (!uebung.id) return;
    if (!confirm(`"${uebung.name}" wirklich löschen?`)) return;

    this.uebungService.delete(uebung.id).subscribe({
      next: () => this.uebungen.update((list) => list.filter((u) => u.id !== uebung.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Übung konnte nicht gelöscht werden.'))
    });
  }
}
