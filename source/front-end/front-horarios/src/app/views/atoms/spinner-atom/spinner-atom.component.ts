import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner-atom',
  standalone: true,
  template: `
    <div class="spinner" role="status" aria-label="Cargando"></div>
  `,
  styles: [`
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerAtomComponent {}
