import { Component, OnInit, inject } from '@angular/core';
import { ConnectionController } from '../../../controllers/connection.controller';
import { MainLayoutTemplateComponent } from '../../templates/main-layout-template/main-layout-template.component';
import { ConnectionCardOrganismComponent } from '../../organisms/connection-card-organism/connection-card-organism.component';

@Component({
  selector: 'app-connection-check-page',
  standalone: true,
  imports: [MainLayoutTemplateComponent, ConnectionCardOrganismComponent],
  template: `
    <app-main-layout-template>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 460px">
        @if (controller.loading()) {
          <app-connection-card-organism
            [loading]="true"
            badgeLabel="CONECTANDO"
            variant="loading"
            title="Verificando conexión SIGH..."
            [description]="'Consultando el servicio ' + controller.endpointUrl">
          </app-connection-card-organism>
        } @else if (controller.errorMessage()) {
          <app-connection-card-organism
            [loading]="false"
            badgeLabel="ERROR DE CONEXIÓN"
            variant="error"
            title="No se pudo conectar a la base de datos"
            [description]="controller.errorMessage()!"
            [showButton]="true"
            buttonText="Reintentar conexión"
            (buttonClick)="retry()">
          </app-connection-card-organism>
        }
      </div>
    </app-main-layout-template>
  `
})
export class ConnectionCheckPageComponent implements OnInit {
  readonly controller = inject(ConnectionController);

  ngOnInit(): void {
    this.controller.verifyAndRedirect();
  }

  retry(): void {
    this.controller.verifyAndRedirect();
  }
}