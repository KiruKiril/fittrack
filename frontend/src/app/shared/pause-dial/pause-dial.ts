import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pause-dial',
  templateUrl: './pause-dial.html',
  styleUrl: './pause-dial.scss'
})
export class PauseDial {
  @Input() value = 0;
  @Input() max = 180;
  @Input() step = 5;
  @Input() label = '';
  @Output() valueChange = new EventEmitter<number>();

  dragging = false;

  private readonly radius = 50;
  readonly circumference = 2 * Math.PI * this.radius;

  get fraction(): number {
    if (this.max <= 0) return 0;
    return Math.min(1, Math.max(0, this.value / this.max));
  }

  get dashOffset(): number {
    return this.circumference * (1 - this.fraction);
  }

  get handleX(): number {
    return 60 + this.radius * Math.sin(this.fraction * 2 * Math.PI);
  }

  get handleY(): number {
    return 60 - this.radius * Math.cos(this.fraction * 2 * Math.PI);
  }

  onPointerDown(event: PointerEvent): void {
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.dragging = true;
    this.updateFromPointer(event);
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.updateFromPointer(event);
    event.preventDefault();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  private updateFromPointer(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;

    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += 2 * Math.PI;
    const fraction = angle / (2 * Math.PI);

    const raw = fraction * this.max;
    const snapped = Math.round(raw / this.step) * this.step;
    this.emitValue(Math.min(this.max, Math.max(0, snapped)));
  }

  onTypeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    const clean = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
    this.emitValue(clean);
  }

  private emitValue(v: number): void {
    if (v === this.value) return;
    this.value = v;
    this.valueChange.emit(v);
  }
}
