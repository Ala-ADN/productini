import {
  Directive,
  ElementRef,
  input,
  effect,
  inject,
  Renderer2
} from '@angular/core';

/**
 * ColorScaleDirective - Dynamically changes background color based on percentage
 * 
 * Uses Angular Signals with effect() to reactively update colors.
 * Color scale: Red (0%) -> Yellow (50%) -> Green (100%)
 * 
 * Usage: <div [appColorScale]="progressValue"></div>
 */
@Directive({
  selector: '[appColorScale]',
  standalone: true
})
export class ColorScaleDirective {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /** Input signal for the percentage value (0-100) */
  readonly appColorScale = input.required<number>();

  constructor() {
    // Effect to reactively update color when input changes
    effect(() => {
      const percentage = this.appColorScale();
      const color = this.calculateColor(percentage);
      this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
    });
  }

  /**
   * Calculate RGB color based on percentage
   * Red (0%) -> Yellow (50%) -> Green (100%)
   */
  private calculateColor(percentage: number): string {
    // Clamp percentage to 0-100
    const p = Math.max(0, Math.min(100, percentage));

    let r: number, g: number, b: number;

    if (p <= 50) {
      // Red to Yellow (0-50%)
      // Red: 255 -> 255, Green: 0 -> 200, Blue: 0 -> 0
      r = 239; // Softer red
      g = Math.round((p / 50) * 200);
      b = 68;
    } else {
      // Yellow to Green (50-100%)
      // Red: 255 -> 76, Green: 200 -> 175, Blue: 0 -> 80
      const t = (p - 50) / 50;
      r = Math.round(239 - t * 163); // 239 -> 76
      g = Math.round(200 - t * 25);  // 200 -> 175
      b = Math.round(68 + t * 12);   // 68 -> 80
    }

    return `rgb(${r}, ${g}, ${b})`;
  }
}
