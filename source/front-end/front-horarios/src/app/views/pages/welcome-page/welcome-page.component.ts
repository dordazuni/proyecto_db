import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionController } from '../../../controllers/connection.controller';
import { MainLayoutTemplateComponent } from '../../templates/main-layout-template/main-layout-template.component';
import { ConnectionCardOrganismComponent } from '../../organisms/connection-card-organism/connection-card-organism.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [MainLayoutTemplateComponent, ConnectionCardOrganismComponent],
  template: `
    <app-main-layout-template>
      <app-connection-card-organism
        [loading]="false"
        badgeLabel="CONECTADO"
        variant="success"
        title="hola estoy conectado a la db"
        [description]="controller.echoData()?.message || 'Conexión verificada exitosamente con PostgreSQL.'"
        [showButton]="true"
        buttonText="Volver a verificar"
        (buttonClick)="goBack()">
      </app-connection-card-organism>
    </app-main-layout-template>
  `
})
export class WelcomePageComponent {
  readonly controller = inject(ConnectionController);
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['/']);
  }
}
