import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConnectionController } from '../../../controllers/connection.controller';
import { SighController } from '../../../controllers/sigh.controller';
import { RuleAlertMoleculeComponent } from '../../molecules/rule-alert-molecule/rule-alert-molecule.component';
import { CatalogosModuleOrganismComponent } from '../../organisms/catalogos-module-organism/catalogos-module-organism.component';
import { PlaneacionModuleOrganismComponent } from '../../organisms/planeacion-module-organism/planeacion-module-organism.component';
import { ProgramacionModuleOrganismComponent } from '../../organisms/programacion-module-organism/programacion-module-organism.component';
import { ReportesModuleOrganismComponent } from '../../organisms/reportes-module-organism/reportes-module-organism.component';
import { SeguridadModuleOrganismComponent } from '../../organisms/seguridad-module-organism/seguridad-module-organism.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RuleAlertMoleculeComponent,
    CatalogosModuleOrganismComponent,
    PlaneacionModuleOrganismComponent,
    ProgramacionModuleOrganismComponent,
    ReportesModuleOrganismComponent,
    SeguridadModuleOrganismComponent
  ],
  template: `
    <div class="sigh-shell">
      <!-- MATERIAL TOP APP BAR -->
      <header class="sigh-appbar">
        <div class="appbar-left">
          <div class="app-logo">
            <span class="material-icons">calendar_month</span>
          </div>
          <div>
            <div class="app-title">SIGH — Gestión de Horarios Académicos</div>
            <div class="app-subtitle">Sistema Integrado de Gestión de Horarios</div>
          </div>
        </div>

        <div class="appbar-controls">
          <!-- Selector Global de Período Académico -->
          <div class="appbar-control-group">
            <label>Período Activo (RF-01):</label>
            <select
              class="appbar-select"
              [ngModel]="sigh.selectedPeriodoId()"
              (ngModelChange)="sigh.seleccionarPeriodo($event)">
              @for (p of sigh.periodos(); track p.idPeriodo) {
                <option [ngValue]="p.idPeriodo">{{ p.codigo }} ({{ p.estado }})</option>
              }
            </select>
          </div>

          <!-- Usuario Autenticado desde Token JWT (RF-23, RF-25 y RNF-04) -->
          @if (sigh.api.authenticatedUser(); as authUser) {
            <div class="appbar-control-group">
              <span class="md-chip md-chip-info">
                <span class="material-icons" style="font-size: 15px">verified_user</span>
                {{ authUser.nombreUsuario }} ({{ authUser.nombreRol }})
              </span>
            </div>
          }

          <button type="button" class="md-btn md-btn-danger md-btn-sm" (click)="cerrarSesion()">
            <span class="material-icons">logout</span> Cerrar Sesión
          </button>
        </div>
      </header>

      <!-- BODY: MATERIAL NAVIGATION DRAWER + WORKSPACE -->
      <div class="sigh-body">
        <aside class="sigh-drawer">
          <nav class="drawer-nav">
            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'inicio'"
              (click)="sigh.setModule('inicio')">
              <span class="material-icons">dashboard</span>
              <span>00. Inicio</span>
            </button>

            @if (sigh.canViewCatalogos()) {
              <button
                class="drawer-item"
                [class.active]="sigh.activeModule() === 'catalogos'"
                (click)="sigh.setModule('catalogos')">
                <span class="material-icons">folder_special</span>
                <span>01. Catálogos (RF-01..08)</span>
              </button>
            }

            @if (sigh.canViewPlaneacion()) {
              <button
                class="drawer-item"
                [class.active]="sigh.activeModule() === 'planeacion'"
                (click)="sigh.setModule('planeacion')">
                <span class="material-icons">assignment</span>
                <span>02. Planeación ({{ sigh.isDocente() ? 'RF-11' : 'RF-09..11' }})</span>
              </button>
            }

            @if (sigh.canViewProgramacion()) {
              <button
                class="drawer-item"
                [class.active]="sigh.activeModule() === 'programacion'"
                (click)="sigh.setModule('programacion')">
                <span class="material-icons">view_timeline</span>
                <span>03. Programación (RF-12..17)</span>
              </button>
            }

            @if (sigh.canViewReportes()) {
              <button
                class="drawer-item"
                [class.active]="sigh.activeModule() === 'reportes'"
                (click)="sigh.setModule('reportes')">
                <span class="material-icons">analytics</span>
                <span>04. Reportes ({{ sigh.isDocente() ? 'RF-19' : 'RF-19..22' }})</span>
              </button>
            }

            @if (sigh.canViewSeguridad()) {
              <button
                class="drawer-item"
                [class.active]="sigh.activeModule() === 'seguridad'"
                (click)="sigh.setModule('seguridad')">
                <span class="material-icons">admin_panel_settings</span>
                <span>05. Seguridad (RF-23..25)</span>
              </button>
            }
          </nav>

          <div class="drawer-footer">
            @if (connectionController.echoData()?.databaseConnected === true) {
              <div class="db-pill">
                <span class="dot-online"></span>
                <span>Conexión Activa ({{ sigh.userRole() }})</span>
              </div>
            } @else {
              <div class="db-pill" style="color: #991b1b">
                <span class="dot-online" style="background: #ef4444"></span>
                <span>Sin Conexión</span>
              </div>
            }
            <small>Arquitectura MVC + Atomic &amp; Material Design</small>
          </div>
        </aside>

        <main class="sigh-main">
          <!-- Banner Global de Alertas y Reglas de Negocio (RN-01 a RN-22 / RNF-10) -->
          <app-rule-alert-molecule
            [alert]="sigh.alert()"
            (dismiss)="sigh.clearAlert()">
          </app-rule-alert-molecule>

          <!-- 00. MÓDULO DE INICIO -->
          @if (sigh.activeModule() === 'inicio') {
            <div class="md-card hero-card">
              <div class="hero-left">
                @if (connectionController.echoData()?.databaseConnected === true) {
                  <span class="md-chip md-chip-success">
                    <span class="material-icons" style="font-size: 16px">storage</span>
                    CONEXIÓN ACTIVA — ROL: {{ sigh.userRole() }}
                  </span>
                } @else {
                  <span class="md-chip md-chip-error">
                    <span class="material-icons" style="font-size: 16px">error_outline</span>
                    SIN CONEXIÓN VERIFICADA
                  </span>
                }
                <h1 class="hero-title">Panel General — SIGH</h1>
                <p class="hero-desc">
                  Bienvenido al Sistema Integrado de Gestión de Horarios Académicos. Selecciona un módulo en el menú lateral o utiliza las acciones directas para gestionar la programación institucional.
                </p>
                <div class="hero-actions">
                  @if (sigh.canViewProgramacion()) {
                    <button class="md-btn md-btn-filled" (click)="sigh.setModule('programacion')">
                      <span class="material-icons">view_timeline</span> Ir a Programación de Horarios
                    </button>
                  }
                  @if (sigh.canViewPlaneacion()) {
                    <button class="md-btn md-btn-tonal" (click)="sigh.setModule('planeacion')">
                      <span class="material-icons">assignment</span>
                      {{ sigh.isDocente() ? 'Gestionar Mi Disponibilidad (RF-11)' : 'Ir a Planeación Académica' }}
                    </button>
                  }
                  @if (sigh.canViewCatalogos()) {
                    <button class="md-btn md-btn-tonal" (click)="sigh.setModule('catalogos')">
                      <span class="material-icons">folder_special</span> Gestionar Catálogos
                    </button>
                  }
                  <button class="md-btn md-btn-outlined" (click)="sigh.setModule('reportes')">
                    <span class="material-icons">analytics</span> Ver Consultas y Reportes
                  </button>
                </div>
              </div>
            </div>

            <!-- KPIs del Sistema SIGH (filtrados según permisos del rol activo) -->
            <div class="kpi-grid">
              @if (sigh.canViewCatalogos()) {
                <div class="kpi-card" (click)="sigh.setModule('catalogos')">
                  <span class="material-icons kpi-icon">school</span>
                  <div>
                    <div class="kpi-value">{{ sigh.docentes().length }}</div>
                    <div class="kpi-label">Docentes (RF-02)</div>
                  </div>
                </div>

                <div class="kpi-card" (click)="sigh.setModule('catalogos')">
                  <span class="material-icons kpi-icon">meeting_room</span>
                  <div>
                    <div class="kpi-value">{{ sigh.espacios().length }}</div>
                    <div class="kpi-label">Espacios Físicos (RF-03)</div>
                  </div>
                </div>
              }

              <div class="kpi-card" (click)="sigh.canViewCatalogos() ? sigh.setModule('catalogos') : sigh.setModule('reportes')">
                <span class="material-icons kpi-icon">menu_book</span>
                <div>
                  <div class="kpi-value">{{ sigh.cursos().length }}</div>
                  <div class="kpi-label">Cursos (RF-05)</div>
                </div>
              </div>

              @if (sigh.isAdmin() || sigh.isCoordinador()) {
                <div class="kpi-card" (click)="sigh.setModule('planeacion')">
                  <span class="material-icons kpi-icon">class</span>
                  <div>
                    <div class="kpi-value">{{ sigh.secciones().length }}</div>
                    <div class="kpi-label">Secciones Periodo (RF-09)</div>
                  </div>
                </div>
              }

              @if (sigh.canViewProgramacion()) {
                <div class="kpi-card" (click)="sigh.setModule('programacion')">
                  <span class="material-icons kpi-icon">event_available</span>
                  <div>
                    <div class="kpi-value">{{ sigh.horarioGrilla().length }}</div>
                    <div class="kpi-label">Sesiones en Versión (RF-13)</div>
                  </div>
                </div>
              }

              @if (sigh.canViewSeguridad()) {
                <div class="kpi-card" (click)="sigh.setModule('seguridad')">
                  <span class="material-icons kpi-icon">history_edu</span>
                  <div>
                    <div class="kpi-value">{{ sigh.auditoria().length }}</div>
                    <div class="kpi-label">Registros Bitácora (RF-24)</div>
                  </div>
                </div>
              }
            </div>

            <!-- Resumen de Módulos habilitados para el Rol -->
            <div class="md-card">
              <div class="md-card-header">
                <h3 class="md-card-title">
                  <span class="material-icons">fact_check</span>
                  Módulos Habilitados para tu Rol ({{ sigh.userRole() }} — RF-25 / RNF-04)
                </h3>
              </div>
              <div class="md-table-container">
                <table class="md-table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Requisitos Funcionales</th>
                      <th>Permisos Activos para {{ sigh.userRole() }}</th>
                      <th>Acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (sigh.canViewCatalogos()) {
                      <tr>
                        <td><strong>01. Catálogos</strong></td>
                        <td>RF-01 a RF-08</td>
                        <td>
                          {{ sigh.isAdmin() ? 'Gestión de Períodos, Recursos, Dotación de Espacios y Parámetros (CU-01)' : 'Gestión de Cursos, Requisitos Técnicos y Habilitación Docente (CU-05)' }}
                        </td>
                        <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('catalogos')">Abrir</button></td>
                      </tr>
                    }
                    @if (sigh.canViewPlaneacion()) {
                      <tr>
                        <td><strong>02. Planeación</strong></td>
                        <td>{{ sigh.isDocente() ? 'RF-11' : 'RF-09 a RF-11' }}</td>
                        <td>
                          {{ sigh.isDocente() ? 'Registro y edición de tu propia disponibilidad horaria (RN-19)' : sigh.isAdmin() ? 'Registro de matrícula real de secciones desde sistemas fuente (RF-10)' : 'Apertura de secciones, sobrecupos justificados (RN-10), cierre y consulta de disponibilidad' }}
                        </td>
                        <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('planeacion')">Abrir</button></td>
                      </tr>
                    }
                    @if (sigh.canViewProgramacion()) {
                      <tr>
                        <td><strong>03. Programación</strong></td>
                        <td>RF-12 a RF-17</td>
                        <td>
                          {{ sigh.isCoordinador() ? 'Crear versión, asignar/mover/eliminar sesiones y enviar a aprobación (CU-07)' : sigh.isAprobador() ? 'Avalar versión o devolver a edición (RF-16 / CU-08)' : 'Sincronizar versión avalada con repositorio documental (RF-17 / CU-04)' }}
                        </td>
                        <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('programacion')">Abrir</button></td>
                      </tr>
                    }
                    <tr>
                      <td><strong>04. Consultas y Reportes</strong></td>
                      <td>{{ sigh.isDocente() ? 'RF-19' : 'RF-19 a RF-22' }}</td>
                      <td>
                        {{ sigh.isDocente() ? 'Consulta de horario académico publicado (v_horario)' : 'Consulta de horarios, carga docente vs contrato y alertas de programación (CU-11)' }}
                      </td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('reportes')">Abrir</button></td>
                    </tr>
                    @if (sigh.canViewSeguridad()) {
                      <tr>
                        <td><strong>05. Seguridad y Auditoría</strong></td>
                        <td>RF-23 a RF-25</td>
                        <td>Gestión de usuarios, roles y consulta de bitácora inmutable log_auditoria (CU-02)</td>
                        <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('seguridad')">Abrir</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- 01. CATÁLOGOS -->
          @if (sigh.activeModule() === 'catalogos' && sigh.canViewCatalogos()) {
            <app-catalogos-module-organism></app-catalogos-module-organism>
          }

          <!-- 02. PLANEACIÓN -->
          @if (sigh.activeModule() === 'planeacion' && sigh.canViewPlaneacion()) {
            <app-planeacion-module-organism></app-planeacion-module-organism>
          }

          <!-- 03. PROGRAMACIÓN DE HORARIOS -->
          @if (sigh.activeModule() === 'programacion' && sigh.canViewProgramacion()) {
            <app-programacion-module-organism></app-programacion-module-organism>
          }

          <!-- 04. CONSULTAS Y REPORTES -->
          @if (sigh.activeModule() === 'reportes') {
            <app-reportes-module-organism></app-reportes-module-organism>
          }

          <!-- 05. SEGURIDAD Y AUDITORÍA -->
          @if (sigh.activeModule() === 'seguridad' && sigh.canViewSeguridad()) {
            <app-seguridad-module-organism></app-seguridad-module-organism>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .sigh-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--md-background);
    }
    .sigh-appbar {
      background: #1a73e8;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      flex-wrap: wrap;
      z-index: 10;
    }
    .appbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .app-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .app-logo .material-icons {
      font-size: 24px;
      color: #ffffff;
    }
    .app-title {
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .app-subtitle {
      font-size: 0.76rem;
      opacity: 0.9;
    }
    .appbar-controls {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .appbar-control-group {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
    }
    .appbar-select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-family: 'Roboto', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
    }
    .appbar-select option {
      color: #1e293b;
      background: #ffffff;
    }
    .sigh-body {
      flex: 1;
      display: flex;
      min-height: calc(100vh - 62px);
    }
    .sigh-drawer {
      width: 245px;
      background: #ffffff;
      border-right: 1px solid var(--md-outline-light);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px 10px;
      flex-shrink: 0;
    }
    .drawer-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .drawer-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 24px;
      border: none;
      background: transparent;
      color: var(--md-text-secondary);
      font-family: 'Roboto', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }
    .drawer-item:hover {
      background-color: #f1f5f9;
      color: var(--md-text-primary);
    }
    .drawer-item.active {
      background-color: var(--md-primary-container);
      color: var(--md-on-primary-container);
      font-weight: 600;
    }
    .drawer-footer {
      padding: 12px;
      border-top: 1px solid var(--md-outline-light);
      font-size: 0.75rem;
      color: var(--md-text-secondary);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .db-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #166534;
    }
    .dot-online {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
    }
    .sigh-main {
      flex: 1;
      padding: 20px 24px;
      overflow-x: hidden;
    }
    .hero-card {
      background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
      border-left: 5px solid var(--md-primary);
    }
    .hero-title {
      margin: 10px 0 6px;
      font-size: 1.65rem;
      font-weight: 700;
      color: #0f172a;
    }
    .hero-desc {
      margin: 0 0 16px;
      color: var(--md-text-secondary);
      font-size: 0.95rem;
    }
    .hero-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 14px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid var(--md-outline-light);
      box-shadow: var(--md-elevation-1);
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--md-elevation-2);
    }
    .kpi-icon {
      font-size: 30px;
      color: var(--md-primary);
      background: var(--md-primary-container);
      padding: 10px;
      border-radius: 10px;
    }
    .kpi-value {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--md-text-primary);
      line-height: 1.1;
    }
    .kpi-label {
      font-size: 0.78rem;
      color: var(--md-text-secondary);
      margin-top: 2px;
    }
    @media (max-width: 900px) {
      .sigh-body {
        flex-direction: column;
      }
      .sigh-drawer {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--md-outline-light);
      }
      .drawer-nav {
        flex-direction: row;
        overflow-x: auto;
      }
    }
  `]
})
export class WelcomePageComponent implements OnInit {
  readonly connectionController = inject(ConnectionController);
  readonly sigh = inject(SighController);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.sigh.initializeDashboard();
  }

  cerrarSesion(): void {
    this.sigh.api.logout();
    this.router.navigate(['/login']);
  }
}
