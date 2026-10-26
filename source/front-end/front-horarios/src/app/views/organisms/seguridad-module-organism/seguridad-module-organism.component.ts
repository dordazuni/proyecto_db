import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SighController } from '../../../controllers/sigh.controller';
import { Usuario } from '../../../models/sigh.models';

@Component({
  selector: 'app-seguridad-module-organism',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="md-tabs">
      <button class="md-tab" [class.active]="subTab() === 'usuarios'" (click)="subTab.set('usuarios')">
        <span class="material-icons">manage_accounts</span> RF-23 / RF-25 Usuarios y Roles del Sistema
      </button>
      <button class="md-tab" [class.active]="subTab() === 'auditoria'" (click)="subTab.set('auditoria')">
        <span class="material-icons">history_edu</span> RF-24 Bitácora de Auditoría (Solo Inserción RN-18)
      </button>
    </div>

    <!-- RF-23 y RF-25: USUARIOS Y ROLES -->
    @if (subTab() === 'usuarios') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">person_add</span> RF-23 | Registrar Usuario con Rol (S-09, S-14)</h3>
            <p class="md-card-subtitle">
              Cada usuario tiene un único rol (Administrador, Coordinador académico, Aprobador o Docente) y puede vincularse opcionalmente a un registro de Docente.
            </p>
          </div>
        </div>
        <div class="md-form-grid">
          <div class="md-field">
            <label>Nombre de Usuario</label>
            <input class="md-input" [(ngModel)]="nuevoUsuario.nombreUsuario" placeholder="Ej. aprobador2" />
          </div>
          <div class="md-field">
            <label>Contraseña (RNF-04)</label>
            <input type="password" class="md-input" [(ngModel)]="nuevoUsuario.contrasena" placeholder="••••••••" />
          </div>
          <div class="md-field">
            <label>Rol del Sistema (RF-25)</label>
            <select class="md-select" [(ngModel)]="nuevoUsuario.idRol">
              @for (r of sigh.roles(); track r.idRol) {
                <option [ngValue]="r.idRol">#{{ r.idRol }} - {{ r.nombre }}</option>
              }
            </select>
          </div>
          <div class="md-field">
            <label>Vínculo a Docente (Opcional — S-09)</label>
            <select class="md-select" [(ngModel)]="nuevoUsuario.idDocente">
              <option [ngValue]="null">— Sin vínculo a docente —</option>
              @for (d of sigh.docentes(); track d.idDocente) {
                <option [ngValue]="d.idDocente">#{{ d.idDocente }} - {{ d.nombres }} {{ d.apellidos }}</option>
              }
            </select>
          </div>
          <div>
            <button class="md-btn md-btn-filled" (click)="crearUsuario()">
              <span class="material-icons">person_add_alt_1</span> Crear Usuario
            </button>
          </div>
        </div>
      </div>

      <div class="md-card">
        <div class="md-card-header">
          <h3 class="md-card-title"><span class="material-icons">group</span> Usuarios del Sistema ({{ sigh.usuarios().length }})</h3>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol (RF-25)</th>
                <th>Docente Vinculado (S-09)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of sigh.usuarios(); track u.idUsuario) {
                <tr>
                  <td>#{{ u.idUsuario }}</td>
                  <td><strong>{{ u.nombreUsuario }}</strong></td>
                  <td><span class="md-chip md-chip-info">{{ u.nombreRol || 'Rol #' + u.idRol }}</span></td>
                  <td>{{ u.nombreDocente || '—' }}</td>
                  <td>
                    <span class="md-chip" [ngClass]="u.activo ? 'md-chip-success' : 'md-chip-error'">
                      {{ u.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="md-btn md-btn-tonal md-btn-sm"
                      (click)="sigh.setActiveUser(u.idUsuario!)">
                      <span class="material-icons">login</span> Usar este Usuario (X-Usuario-Id)
                    </button>
                    <button
                      class="md-btn md-btn-outlined md-btn-sm"
                      style="margin-left: 6px"
                      (click)="toggleEstadoUsuario(u)">
                      {{ u.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-24: BITÁCORA DE AUDITORÍA -->
    @if (subTab() === 'auditoria') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">policy</span>
              RF-24 | Bitácora de Auditoría Inmutable (log_auditoria — Regla RN-18 / RNF-06)
            </h3>
            <p class="md-card-subtitle">
              Registrada automáticamente por disparadores en PostgreSQL ante cada INSERT, UPDATE o DELETE en asignaciones y cambios de estado de versiones.
            </p>
          </div>
        </div>

        <div class="md-form-grid" style="margin-bottom: 16px">
          <div class="md-field">
            <label>Tabla Afectada</label>
            <select class="md-select" [(ngModel)]="filtroAuditoria.tablaAfectada" (ngModelChange)="aplicarFiltroAuditoria()">
              <option value="">— Todas las tablas —</option>
              <option value="asignacion">asignacion</option>
              <option value="version_horario">version_horario</option>
              <option value="disponibilidad">disponibilidad</option>
            </select>
          </div>
          <div class="md-field">
            <label>Acción</label>
            <select class="md-select" [(ngModel)]="filtroAuditoria.accion" (ngModelChange)="aplicarFiltroAuditoria()">
              <option value="">— Todas las acciones —</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="md-field">
            <label>Usuario</label>
            <select class="md-select" [(ngModel)]="filtroAuditoria.idUsuario" (ngModelChange)="aplicarFiltroAuditoria()">
              <option [ngValue]="null">— Todos los usuarios —</option>
              @for (u of sigh.usuarios(); track u.idUsuario) {
                <option [ngValue]="u.idUsuario">#{{ u.idUsuario }} - {{ u.nombreUsuario }}</option>
              }
            </select>
          </div>
          <div>
            <button class="md-btn md-btn-outlined" (click)="limpiarFiltroAuditoria()">
              <span class="material-icons">refresh</span> Actualizar Bitácora
            </button>
          </div>
        </div>

        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Log</th>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              @for (log of sigh.auditoria(); track log.idLog) {
                <tr>
                  <td>#{{ log.idLog }}</td>
                  <td>{{ log.fechaHora | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                  <td><strong>{{ log.nombreUsuario || 'Usuario #' + log.idUsuario }}</strong></td>
                  <td>
                    <span
                      class="md-chip"
                      [ngClass]="
                        log.accion === 'INSERT'
                          ? 'md-chip-success'
                          : log.accion === 'DELETE'
                            ? 'md-chip-error'
                            : 'md-chip-info'
                      ">
                      {{ log.accion }}
                    </span>
                  </td>
                  <td><code>{{ log.tablaAfectada }}</code></td>
                  <td style="font-family: 'Roboto Mono', monospace; font-size: 0.78rem">{{ log.detalle }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">No se encontraron registros en la bitácora de auditoría.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class SeguridadModuleOrganismComponent {
  readonly sigh = inject(SighController);
  readonly subTab = signal<'usuarios' | 'auditoria'>('usuarios');

  nuevoUsuario: Usuario = {
    nombreUsuario: '',
    contrasena: '',
    activo: true,
    idRol: 1,
    idDocente: null
  };

  filtroAuditoria: {
    tablaAfectada: string;
    accion: string;
    idUsuario: number | null;
  } = {
    tablaAfectada: '',
    accion: '',
    idUsuario: null
  };

  crearUsuario(): void {
    if (!this.nuevoUsuario.nombreUsuario || !this.nuevoUsuario.contrasena) return;
    this.sigh.crearUsuario({ ...this.nuevoUsuario });
    this.nuevoUsuario = {
      nombreUsuario: '',
      contrasena: '',
      activo: true,
      idRol: this.sigh.roles()[0]?.idRol || 1,
      idDocente: null
    };
  }

  toggleEstadoUsuario(u: Usuario): void {
    if (!u.idUsuario) return;
    this.sigh.actualizarUsuario(u.idUsuario, {
      activo: !u.activo,
      idRol: u.idRol
    });
  }

  aplicarFiltroAuditoria(): void {
    this.sigh.filtrarAuditoria({
      tablaAfectada: this.filtroAuditoria.tablaAfectada || null,
      accion: this.filtroAuditoria.accion || null,
      idUsuario: this.filtroAuditoria.idUsuario
    });
  }

  limpiarFiltroAuditoria(): void {
    this.filtroAuditoria = { tablaAfectada: '', accion: '', idUsuario: null };
    this.aplicarFiltroAuditoria();
  }
}
