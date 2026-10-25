import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button-atom',
  standalone: true,
  template: `
    <button
      type="button"
      class="btn"
      [disabled]="disabled"
      (click)="action.emit()">
      {{ text }}
    </button>
  `,
  styles: [`
    .btn {
      background-color: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn:hover:not(:disabled) {
      background-color: #1d4ed8;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ButtonAtomComponent {
  @Input() text = 'Continuar';
  @Input() disabled = false;
  @Output() action = new EventEmitter<void>();
}
