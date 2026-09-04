import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

/**
 * Ein Drehregler wie ein Lautstaerkeknopf: eine volle Umdrehung entspricht `max` Sekunden,
 * aber man kann beliebig weiterdrehen ("ueberdrehen") - der Wert zaehlt einfach weiter hoch,
 * der Ring fuellt sich pro Runde neu. Verfolgt dafuer die Drehung relativ (Winkel-Delta
 * zwischen zwei Pointer-Events) statt absolut auf die Antippstelle zu springen.
 */
@Component({
  selector: 'app-pause-dial',
  templateUrl: './pause-dial.html',
  styleUrl: './pause-dial.scss'
})
export class PauseDial implements OnChanges {
  @Input() value = 0;
  @Input() max = 180;
  @Input() step = 5;
  @Input() ceiling = 1800;
  @Input() label = '';
  @Output() valueChange = new EventEmitter<number>();

  dragging = false;

  private readonly radius = 50;
  readonly circumference = 2 * Math.PI * this.radius;

  /** Aufsummierter Drehwinkel in Radiant, kann > 2*PI sein (mehrere Runden). */
  private totalAngle = 0;
  private lastAngle = 0;

  /** Der Wert, den die Komponente selbst zuletzt emittiert hat - kommt er unveraendert
   *  ueber das Eltern-Binding zurueck, ist das nur das Echo unseres eigenen Updates und
   *  darf totalAngle nicht ueberschreiben (sonst driftet die Drehung durch das Runden
   *  auf `step` bei jedem einzelnen Pointer-Event minimal auseinander). */
  private lastEmitted: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['value'] || changes['max']) && this.value !== this.lastEmitted) {
      this.syncAngleFromValue();
    }
  }

  private syncAngleFromValue(): void {
    if (this.max > 0) {
      this.totalAngle = (this.value / this.max) * 2 * Math.PI;
    }
  }

  /** Ringfuellung der aktuellen Runde (0-1) - bei vollen Runden bewusst 1 statt 0, damit "ueberdreht" sichtbar bleibt. */
  get ringFraction(): number {
    if (this.max <= 0) return 0;
    const lap = (this.value / this.max) % 1;
    if (this.value > 0 && lap === 0) return 1;
    return lap;
  }

  get dashOffset(): number {
    return this.circumference * (1 - this.ringFraction);
  }

  get handleX(): number {
    return 60 + this.radius * Math.sin(this.ringFraction * 2 * Math.PI);
  }

  get handleY(): number {
    return 60 - this.radius * Math.cos(this.ringFraction * 2 * Math.PI);
  }

  /** Wie viele volle Runden der aktuelle Wert bereits darstellt (fuers kleine "x2"-Badge). */
  get laps(): number {
    if (this.max <= 0) return 0;
    return Math.floor(this.value / this.max);
  }

  onPointerDown(event: PointerEvent): void {
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.dragging = true;
    this.lastAngle = this.pointerAngle(event);
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const angle = this.pointerAngle(event);

    let delta = angle - this.lastAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    this.lastAngle = angle;
    this.totalAngle += delta;

    const maxAngle = this.max > 0 ? (this.ceiling / this.max) * 2 * Math.PI : 0;
    this.totalAngle = Math.min(maxAngle, Math.max(0, this.totalAngle));

    const raw = (this.totalAngle / (2 * Math.PI)) * this.max;
    const snapped = Math.round(raw / this.step) * this.step;
    this.emitValue(Math.min(this.ceiling, Math.max(0, snapped)), false);

    event.preventDefault();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  private pointerAngle(event: PointerEvent): number {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;

    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  }

  onTypeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    const clean = Number.isFinite(raw) ? Math.min(this.ceiling, Math.max(0, Math.round(raw))) : 0;
    this.emitValue(clean, true);
  }

  private emitValue(v: number, resync: boolean): void {
    if (v === this.value) return;
    this.value = v;
    this.lastEmitted = v;
    if (resync) this.syncAngleFromValue();
    this.valueChange.emit(v);
  }
}
