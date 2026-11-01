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
                placeholder="Ej. admin, coordinador, aprobador, ana.rojas"
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

        <!-- Acceso rápido para cuentas de demostración (06_datos_prueba.sql) -->
        <div class="demo-accounts-box">
          <div class="demo-box-title">
            <span class="material-icons">verified_user</span>
            <span>Perfiles de Prueba en BD (<code>06_datos_prueba.sql</code> — clic para autocompletar):</span>
          </div>
          <div class="demo-grid">
            <button type="button" class="demo-chip" (click)="seleccionarDemo('admin', '123456')">
              <strong>admin</strong>
              <span>ADMINISTRADOR</span>
            </button>
            <button type="button" class="demo-chip" (click)="seleccionarDemo('coordinador', '123456')">
              <strong>coordinador</strong>
              <span>COORDINADOR</span>
            </button>
            <button type="button" class="demo-chip" (click)="seleccionarDemo('aprobador', '123456')">
              <strong>aprobador</strong>
              <span>APROBADOR</span>
            </button>
            <button type="button" class="demo-chip" (click)="seleccionarDemo('ana.rojas', '123456')">
              <strong>ana.rojas</strong>
              <span>DOCENTE</span>
            </button>
          </div>
          <small class="demo-hint">
            Contraseña predeterminada para usuarios semilla: <code>123456</code> (o el mismo nombre de usuario).
          </small>
        </div>
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
    .demo-accounts-box {
      margin-top: 22px;
      padding: 14px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid var(--md-outline-light);
    }
    .demo-box-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--md-text-secondary);
      margin-bottom: 10px;
    }
    .demo-box-title .material-icons {
      font-size: 16px;
      color: var(--md-primary);
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }
    .demo-chip {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }
    .demo-chip:hover {
      border-color: var(--md-primary);
      background: var(--md-primary-container);
    }
    .demo-chip strong {
      font-size: 0.82rem;
      color: var(--md-text-primary);
    }
    .demo-chip span {
      font-size: 0.68rem;
      color: var(--md-primary);
      font-weight: 600;
    }
    .demo-hint {
      display: block;
      font-size: 0.74rem;
      color: var(--md-text-secondary);
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

  seleccionarDemo(usuario: string, pass: string): void {
    this.nombreUsuario = usuario;
    this.contrasena = pass;
    this.errorMessage.set(null);
  }

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
            err?.error?.message ||
            'RF-23: Credenciales inválidas o usuario inactivo.';
          this.errorMessage.set(backendMsg);
        }
      });
  }
}
