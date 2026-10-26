import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SighAlert } from '../../../controllers/sigh.controller';

@Component({
  selector: 'app-rule-alert-molecule',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alert) {
      <div class="alert-banner" [ngClass]="'alert-' + alert.type" role="alert">
        <span class="material-icons alert-icon">
          {{ alert.type === 'success' ? 'check_circle' : alert.type === 'warning' ? 'warning' : 'gpp_bad' }}
        </span>
        <div class="alert-content">
          <div class="alert-header">
            <strong>{{ alert.title }}</strong>
            @if (alert.regla) {
              <span class="rule-badge">Regla BD: {{ alert.regla }}</span>
            }
            @if (alert.sqlState) {
              <span class="sql-badge">SQLState: {{ alert.sqlState }}</span>
            }
          </div>
          <p class="alert-msg">{{ alert.message }}</p>
        </div>
        <button type="button" class="close-btn" (click)="dismiss.emit()" title="Cerrar alerta">
          <span class="material-icons">close</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 12px;
      margin-bottom: 18px;
      box-shadow: var(--md-elevation-2);
      border-left: 5px solid;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .alert-success {
      background-color: #e6f4ea;
      border-left-color: #1e8e3e;
      color: #0d652d;
    }
    .alert-error {
      background-color: #fce8e6;
      border-left-color: #d93025;
      color: #a50e0e;
    }
    .alert-warning {
      background-color: #fef7e0;
      border-left-color: #f29900;
      color: #b06000;
    }
    .alert-icon {
      font-size: 24px;
      margin-top: 2px;
    }
    .alert-content {
      flex: 1;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .rule-badge {
      background: #d93025;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .sql-badge {
      background: rgba(0, 0, 0, 0.08);
      padding: 2px 8px;
      border-radius: 999px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.72rem;
    }
    .alert-msg {
      margin: 0;
      font-size: 0.9rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      padding: 4px;
      border-radius: 50%;
    }
    .close-btn:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.06);
    }
  `]
})
export class RuleAlertMoleculeComponent {
  @Input() alert: SighAlert | null = null;
  @Output() dismiss = new EventEmitter<void>();
}
