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

  bibliothek = signal<Uebung[]>([]);
  bibliothekOpen = signal(false);
  bibliothekLoading = signal(false);
  addingId = signal<number | null>(null);

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

  verwendetHinweis(uebung: Uebung): string | null {
    const trainings = uebung.verwendetInTrainings;
    if (!trainings || trainings.length === 0) return null;
    return `Wird verwendet in: ${trainings.join(', ')}`;
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
    const frage = uebung.bibliothek
      ? `"${uebung.name}" aus deiner Liste entfernen?`
      : `"${uebung.name}" wirklich löschen?`;
    if (!confirm(frage)) return;

    this.uebungService.delete(uebung.id).subscribe({
      next: () => this.uebungen.update((list) => list.filter((u) => u.id !== uebung.id)),
      error: (err) => this.error.set(extractErrorMessage(err, 'Übung konnte nicht entfernt werden.'))
    });
  }

  toggleBibliothek(): void {
    this.bibliothekOpen.update((v) => !v);
    this.error.set(null);
    if (this.bibliothekOpen()) {
      this.loadBibliothek();
    }
  }

  private loadBibliothek(): void {
    this.bibliothekLoading.set(true);
    this.uebungService.getBibliothek().subscribe({
      next: (data) => {
        this.bibliothek.set(data);
        this.bibliothekLoading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Bibliothek konnte nicht geladen werden.'));
        this.bibliothekLoading.set(false);
      }
    });
  }

  addFromBibliothek(uebung: Uebung): void {
    if (!uebung.id) return;
    this.addingId.set(uebung.id);
    this.uebungService.addFromBibliothek(uebung.id).subscribe({
      next: (added) => {
        this.uebungen.update((list) => [...list, added]);
        this.bibliothek.update((list) => list.filter((u) => u.id !== uebung.id));
        this.addingId.set(null);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Übung konnte nicht hinzugefügt werden.'));
        this.addingId.set(null);
      }
    });
  }
}
