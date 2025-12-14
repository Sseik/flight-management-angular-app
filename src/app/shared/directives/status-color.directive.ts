import { Directive, ElementRef, Input, OnChanges, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appStatusColor]',
  standalone: true 
})
export class StatusColorDirective implements OnChanges {
  @Input() appStatusColor = '';
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnChanges(): void {
    let color = '#000'; // Default black
    let fontWeight = 'normal';

    switch (this.appStatusColor) {
      case 'Delayed':
      case 'Cancelled':
        color = '#dc3545'; // Red
        fontWeight = 'bold';
        break;
      case 'On Time':
      case 'Arrived':
      case 'Departed':
        color = '#198754'; // Green
        break;
      case 'Scheduled':
        color = '#0d6efd'; // Blue
        break;
    }
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', fontWeight);
  }
}