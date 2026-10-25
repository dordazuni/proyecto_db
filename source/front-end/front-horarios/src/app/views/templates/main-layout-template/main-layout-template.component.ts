import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout-template',
  standalone: true,
  template: `
    <div class="layout">
      <header class="header">
        <span class="brand">Proyecto DB - Horarios</span>
      </header>
      <main class="content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .header {
      padding: 16px 24px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand {
      font-weight: 700;
      font-size: 1.05rem;
      color: #1e293b;
    }
    .content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
  `]
})
export class MainLayoutTemplateComponent {}
