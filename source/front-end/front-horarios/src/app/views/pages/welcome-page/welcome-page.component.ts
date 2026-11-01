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
            <div class="app-subtitle">Sistema Integrado de Gestión de Horarios · PostgreSQL RDBMS</div>
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

          <button type="button" class="md-btn md-btn-tonal md-btn-sm" (click)="reverificarEcho()">
            <span class="material-icons">sync</span> Verificar /echo
          </button>

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
              <span>00. Inicio y Estado BD</span>
            </button>

            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'catalogos'"
              (click)="sigh.setModule('catalogos')">
              <span class="material-icons">folder_special</span>
              <span>01. Catálogos (RF-01..08)</span>
            </button>

            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'planeacion'"
              (click)="sigh.setModule('planeacion')">
              <span class="material-icons">assignment</span>
              <span>02. Planeación (RF-09..11)</span>
            </button>

            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'programacion'"
              (click)="sigh.setModule('programacion')">
              <span class="material-icons">view_timeline</span>
              <span>03. Programación (RF-12..18)</span>
            </button>

            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'reportes'"
              (click)="sigh.setModule('reportes')">
              <span class="material-icons">analytics</span>
              <span>04. Reportes (RF-19..22)</span>
            </button>

            <button
              class="drawer-item"
              [class.active]="sigh.activeModule() === 'seguridad'"
              (click)="sigh.setModule('seguridad')">
              <span class="material-icons">admin_panel_settings</span>
              <span>05. Seguridad (RF-23..25)</span>
            </button>
          </nav>

          <div class="drawer-footer">
            @if (connectionController.echoData()?.databaseConnected === true) {
              <div class="db-pill">
                <span class="dot-online"></span>
                <span>PostgreSQL Activo</span>
              </div>
            } @else {
              <div class="db-pill" style="color: #991b1b">
                <span class="dot-online" style="background: #ef4444"></span>
                <span>PostgreSQL Sin Verificar</span>
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

          <!-- 00. MÓDULO DE INICIO Y ESTADO DE CONEXIÓN (/echo) -->
          @if (sigh.activeModule() === 'inicio') {
            <div class="md-card hero-card">
              <div class="hero-left">
                @if (connectionController.echoData()?.databaseConnected === true) {
                  <span class="md-chip md-chip-success">
                    <span class="material-icons" style="font-size: 16px">storage</span>
                    CONECTADO A POSTGRESQL (/api/echo)
                  </span>
                } @else {
                  <span class="md-chip md-chip-error">
                    <span class="material-icons" style="font-size: 16px">error_outline</span>
                    SIN CONEXIÓN VERIFICADA (/api/echo)
                  </span>
                }
                <h1 class="hero-title">Panel General — SIGH</h1>
                <p class="hero-desc">
                  {{ connectionController.echoData()?.message || 'Estado de conexión pendiente de verificación con /api/echo.' }}
                </p>
                <div class="hero-actions">
                  <button class="md-btn md-btn-filled" (click)="sigh.setModule('programacion')">
                    <span class="material-icons">view_timeline</span> Ir a Programación de Horarios (CU-07)
                  </button>
                  <button class="md-btn md-btn-tonal" (click)="sigh.setModule('catalogos')">
                    <span class="material-icons">folder_special</span> Gestionar Catálogos (CU-01)
                  </button>
                  <button class="md-btn md-btn-outlined" (click)="sigh.setModule('reportes')">
                    <span class="material-icons">analytics</span> Ver Consultas y Reportes (CU-11)
                  </button>
                </div>
              </div>
            </div>

            <!-- KPIs del Sistema SIGH -->
            <div class="kpi-grid">
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

              <div class="kpi-card" (click)="sigh.setModule('catalogos')">
                <span class="material-icons kpi-icon">menu_book</span>
                <div>
                  <div class="kpi-value">{{ sigh.cursos().length }}</div>
                  <div class="kpi-label">Cursos (RF-05)</div>
                </div>
              </div>

              <div class="kpi-card" (click)="sigh.setModule('planeacion')">
                <span class="material-icons kpi-icon">class</span>
                <div>
                  <div class="kpi-value">{{ sigh.secciones().length }}</div>
                  <div class="kpi-label">Secciones Periodo (RF-09)</div>
                </div>
              </div>

              <div class="kpi-card" (click)="sigh.setModule('programacion')">
                <span class="material-icons kpi-icon">event_available</span>
                <div>
                  <div class="kpi-value">{{ sigh.horarioGrilla().length }}</div>
                  <div class="kpi-label">Sesiones en Versión (RF-13)</div>
                </div>
              </div>

              <div class="kpi-card" (click)="sigh.setModule('seguridad')">
                <span class="material-icons kpi-icon">history_edu</span>
                <div>
                  <div class="kpi-value">{{ sigh.auditoria().length }}</div>
                  <div class="kpi-label">Registros Bitácora (RF-24)</div>
                </div>
              </div>
            </div>

            <!-- Resumen de Módulos del Documento de Requisitos -->
            <div class="md-card">
              <div class="md-card-header">
                <h3 class="md-card-title"><span class="material-icons">fact_check</span> Cobertura de Módulos SIGH (RF-01 a RF-25 y Reglas RN-01 a RN-22)</h3>
              </div>
              <div class="md-table-container">
                <table class="md-table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Requisitos Funcionales</th>
                      <th>Casos de Uso</th>
                      <th>Reglas de Negocio Verificadas en BD</th>
                      <th>Acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>01. Catálogos</strong></td>
                      <td>RF-01 a RF-08</td>
                      <td>CU-01, CU-03, CU-05</td>
                      <td>RN-06, RN-07, RN-08, RN-09, RN-12, RN-14, RN-19</td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('catalogos')">Abrir</button></td>
                    </tr>
                    <tr>
                      <td><strong>02. Planeación</strong></td>
                      <td>RF-09 a RF-11</td>
                      <td>CU-06, CU-09</td>
                      <td>RN-10 (Sobrecupo), RN-11 (Cierre), RN-13, RN-19</td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('planeacion')">Abrir</button></td>
                    </tr>
                    <tr>
                      <td><strong>03. Programación</strong></td>
                      <td>RF-12 a RF-18</td>
                      <td>CU-04, CU-07, CU-08, CU-10</td>
                      <td>RN-01 a RN-17 (Cruces, Aforo, Contrato, Flujo Aval)</td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('programacion')">Abrir</button></td>
                    </tr>
                    <tr>
                      <td><strong>04. Consultas y Reportes</strong></td>
                      <td>RF-19 a RF-22</td>
                      <td>CU-11</td>
                      <td>RN-05, RN-20 (Días consecutivos), RN-21 (Riesgo cierre), RN-22</td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('reportes')">Abrir</button></td>
                    </tr>
                    <tr>
                      <td><strong>05. Seguridad y Auditoría</strong></td>
                      <td>RF-23 a RF-25</td>
                      <td>CU-02</td>
                      <td>RN-18 (Bitácora solo inserción), RN-19, RNF-04, RNF-06</td>
                      <td><button class="md-btn md-btn-tonal md-btn-sm" (click)="sigh.setModule('seguridad')">Abrir</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- 01. CATÁLOGOS -->
          @if (sigh.activeModule() === 'catalogos') {
            <app-catalogos-module-organism></app-catalogos-module-organism>
          }

          <!-- 02. PLANEACIÓN -->
          @if (sigh.activeModule() === 'planeacion') {
            <app-planeacion-module-organism></app-planeacion-module-organism>
          }

          <!-- 03. PROGRAMACIÓN DE HORARIOS -->
          @if (sigh.activeModule() === 'programacion') {
            <app-programacion-module-organism></app-programacion-module-organism>
          }

          <!-- 04. CONSULTAS Y REPORTES -->
          @if (sigh.activeModule() === 'reportes') {
            <app-reportes-module-organism></app-reportes-module-organism>
          }

          <!-- 05. SEGURIDAD Y AUDITORÍA -->
          @if (sigh.activeModule() === 'seguridad') {
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

  reverificarEcho(): void {
    this.router.navigate(['/']);
  }

  cerrarSesion(): void {
    this.sigh.api.logout();
    this.router.navigate(['/login']);
  }
}
