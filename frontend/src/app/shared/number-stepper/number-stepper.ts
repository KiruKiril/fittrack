import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-number-stepper',
  templateUrl: './number-stepper.html',
  styleUrl: './number-stepper.scss'
})
export class NumberStepper {
  @Input() value: number | null = null;
  @Input() step = 1;
  @Input() min = 0;
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<number | null>();

  decrement(): void {
    this.emit(this.round(Math.max(this.min, (this.value ?? 0) - this.step)));
  }

  increment(): void {
    this.emit(this.round((this.value ?? 0) + this.step));
  }

  onTypeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    this.emit(Number.isFinite(raw) ? raw : null);
  }

  private round(v: number): number {
    // Rundungsfehler bei Dezimal-Schritten (z.B. 2.5 + 2.5) vermeiden.
    return Math.round(v * 100) / 100;
  }

  private emit(v: number | null): void {
    this.value = v;
    this.valueChange.emit(v);
  }
}
