import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge-atom',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="variant">
      <span class="dot"></span>
      {{ label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .success {
      background-color: #dcfce7;
      color: #166534;
    }
    .success .dot {
      background-color: #22c55e;
    }
    .loading {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .loading .dot {
      background-color: #3b82f6;
    }
    .error {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .error .dot {
      background-color: #ef4444;
    }
  `]
})
export class StatusBadgeAtomComponent {
  @Input() label = 'VERIFICANDO';
  @Input() variant: 'success' | 'loading' | 'error' = 'loading';
}
