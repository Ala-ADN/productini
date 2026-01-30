import { Pipe, PipeTransform } from '@angular/core';

/**
 * PercentagePipe - Transforms decimal values to percentage strings
 * 
 * Usage: {{ 0.75 | percentage }}  => "75%"
 *        {{ 45 | percentage }}    => "45%"
 *        {{ 0.5 | percentage:1 }} => "50.0%"
 */
@Pipe({
  name: 'percentage',
  standalone: true,
  pure: true
})
export class PercentagePipe implements PipeTransform {
  
  /**
   * Transform a number to a percentage string
   * @param value - The value to transform (can be 0-1 decimal or 0-100)
   * @param decimals - Number of decimal places (default: 0)
   * @param autoDetect - If true, values <= 1 are treated as decimals (default: true)
   */
  transform(
    value: number | null | undefined,
    decimals: number = 0,
    autoDetect: boolean = true
  ): string {
    if (value === null || value === undefined) {
      return '0%';
    }

    let percentage: number;

    // Auto-detect if value is a decimal (0-1) or already a percentage (0-100)
    if (autoDetect && value > 0 && value <= 1) {
      percentage = value * 100;
    } else {
      percentage = value;
    }

    // Clamp to valid percentage range
    percentage = Math.max(0, Math.min(100, percentage));

    return `${percentage.toFixed(decimals)}%`;
  }
}
