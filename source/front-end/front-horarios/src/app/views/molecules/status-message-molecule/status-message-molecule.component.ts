import { Component, Input } from '@angular/core';
import { StatusBadgeAtomComponent } from '../../atoms/status-badge-atom/status-badge-atom.component';

@Component({
  selector: 'app-status-message-molecule',
  standalone: true,
  imports: [StatusBadgeAtomComponent],
  template: `
    <div class="status-message">
      <app-status-badge-atom [label]="badgeLabel" [variant]="variant"></app-status-badge-atom>
      <h1 class="title">{{ title }}</h1>
      @if (description) {
        <p class="description">{{ description }}</p>
      }
    </div>
  `,
  styles: [`
    .status-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .title {
      margin: 4px 0 0;
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
    }
    .description {
      margin: 0;
      font-size: 0.95rem;
      color: #475569;
      line-height: 1.5;
    }
  `]
})
export class StatusMessageMoleculeComponent {
  @Input() badgeLabel = '';
  @Input() variant: 'success' | 'loading' | 'error' = 'loading';
  @Input() title = '';
  @Input() description = '';
}
