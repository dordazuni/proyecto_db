import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SighApiService } from '../../../services/sigh-api.service';
import { SighController } from '../../../controllers/sigh.controller';
import { MainLayoutTemplateComponent } from '../../templates/main-layout-template/main-layout-template.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutTemplateComponent],
  template: `
    <app-main-layout-template>
      <div class="md-card login-card">
        <div class="login-header">
          <div class="login-icon-badge">
            <span class="material-icons">lock_person</span>
          </div>
          <h1 class="login-title">Acceso al Sistema SIGH</h1>
          <p class="login-subtitle">
            Autenticación de Usuarios y Control de Roles (RF-23, RF-25, RNF-04)
          </p>
        </div>

        @if (errorMessage()) {
          <div class="login-error" role="alert">
            <span class="material-icons">gpp_bad</span>
            <div>
              <strong>Error de Autenticación</strong>
              <p>{{ errorMessage() }}</p>
            </div>
          </div>
        }

        <form class="login-form" (ngSubmit)="iniciarSesion()">
          <div class="md-field">
            <label for="nombreUsuario">Nombre de Usuario *</label>
            <div class="input-with-icon">
              <span class="material-icons field-icon">person</span>
              <input
                id="nombreUsuario"
                name="nombreUsuario"
                type="text"
                class="md-input"
                placeholder="Ingrese su nombre de usuario"
                [(ngModel)]="nombreUsuario"
                required
                autocomplete="username" />
            </div>
          </div>

          <div class="md-field">
            <label for="contrasena">Contraseña *</label>
            <div class="input-with-icon">
              <span class="material-icons field-icon">key</span>
              <input
                id="contrasena"
                name="contrasena"
                [type]="mostrarPassword() ? 'text' : 'password'"
                class="md-input"
                placeholder="Ingrese su contraseña"
                [(ngModel)]="contrasena"
                required
                autocomplete="current-password" />
              <button
                type="button"
                class="toggle-pass-btn"
                (click)="mostrarPassword.set(!mostrarPassword())"
                title="Mostrar / ocultar contraseña">
                <span class="material-icons">
                  {{ mostrarPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="md-btn md-btn-filled login-submit-btn"
            [disabled]="loading()">
            <span class="material-icons">{{ loading() ? 'hourglass_top' : 'login' }}</span>
            {{ loading() ? 'Verificando credenciales...' : 'Iniciar Sesión en SIGH' }}
          </button>
        </form>

      </div>
    </app-main-layout-template>
  `,
  styles: [`
    .login-card {
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 28px;
      border-radius: 16px;
      box-shadow: var(--md-elevation-2);
    }
    .login-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 22px;
    }
    .login-icon-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--md-primary-container);
      color: var(--md-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .login-icon-badge .material-icons {
      font-size: 30px;
    }
    .login-title {
      margin: 4px 0 0;
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--md-text-primary);
    }
    .login-subtitle {
      margin: 0;
      font-size: 0.85rem;
      color: var(--md-text-secondary);
    }
    .login-error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--md-error-container);
      color: var(--md-error);
      border-left: 4px solid var(--md-error);
      margin-bottom: 16px;
      font-size: 0.85rem;
    }
    .login-error p {
      margin: 2px 0 0;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .field-icon {
      position: absolute;
      left: 12px;
      color: #64748b;
      font-size: 20px;
      pointer-events: none;
    }
    .input-with-icon .md-input {
      width: 100%;
      padding-left: 40px;
      padding-right: 40px;
    }
    .toggle-pass-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
    }
    .login-submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      margin-top: 4px;
    }
  `]
})
export class LoginPageComponent {
  private readonly api = inject(SighApiService);
  private readonly sigh = inject(SighController);
  private readonly router = inject(Router);

  nombreUsuario = '';
  contrasena = '';
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly mostrarPassword = signal<boolean>(false);

  iniciarSesion(): void {
    if (!this.nombreUsuario.trim() || !this.contrasena.trim()) {
      this.errorMessage.set('Por favor ingrese su nombre de usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api
      .login({
        nombreUsuario: this.nombreUsuario.trim(),
        contrasena: this.contrasena
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.token && res.usuario) {
            // Estado limpio para el usuario que acaba de entrar (nada del anterior).
            this.sigh.resetState();
            this.sigh.showSuccess(
              'Bienvenido a SIGH',
              `Sesión iniciada como ${res.usuario.nombreUsuario} (${res.usuario.nombreRol})`
            );
            this.router.navigate(['/bienvenida']);
          } else {
            this.errorMessage.set('RF-23: Credenciales inválidas o usuario inactivo.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          const backendMsg =
            err?.status === 0
              ? 'No hay conexión con el servidor. Revisa tu conexión a internet o que la máquina virtual esté encendida.'
              : err?.error?.message || 'RF-23: Credenciales inválidas o usuario inactivo.';
          this.errorMessage.set(backendMsg);
        }
      });
  }
}
