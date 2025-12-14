import { Directive, ElementRef, Input, OnChanges, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appStatusColor]', // <--- Це ім'я атрибута в HTML
})
export class StatusColorDirective implements OnChanges {
  @Input() appStatusColor = ''; // <--- Це змінна, в яку ми передаємо дані

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnChanges(): void {
    let color = '#000';
    if (this.appStatusColor === 'Delayed') color = 'red';
    else if (this.appStatusColor === 'On Time') color = 'green';
    
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
  }
}