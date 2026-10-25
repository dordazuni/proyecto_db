import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SpinnerAtomComponent } from '../../atoms/spinner-atom/spinner-atom.component';
import { ButtonAtomComponent } from '../../atoms/button-atom/button-atom.component';
import { StatusMessageMoleculeComponent } from '../../molecules/status-message-molecule/status-message-molecule.component';

@Component({
  selector: 'app-connection-card-organism',
  standalone: true,
  imports: [
    SpinnerAtomComponent,
    ButtonAtomComponent,
    StatusMessageMoleculeComponent
  ],
  template: `
    <section class="card">
      @if (loading) {
        <app-spinner-atom></app-spinner-atom>
      }

      <app-status-message-molecule
        [badgeLabel]="badgeLabel"
        [variant]="variant"
        [title]="title"
        [description]="description">
      </app-status-message-molecule>

      @if (showButton) {
        <div class="actions">
          <app-button-atom
            [text]="buttonText"
            [disabled]="loading"
            (action)="buttonClick.emit()">
          </app-button-atom>
        </div>
      }
    </section>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08),
                  0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
      max-width: 460px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .actions {
      margin-top: 8px;
    }
  `]
})
export class ConnectionCardOrganismComponent {
  @Input() loading = false;
  @Input() badgeLabel = '';
  @Input() variant: 'success' | 'loading' | 'error' = 'loading';
  @Input() title = '';
  @Input() description = '';
  @Input() showButton = false;
  @Input() buttonText = 'Reintentar';
  @Output() buttonClick = new EventEmitter<void>();
}
