import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SighController } from '../../../controllers/sigh.controller';
import { TimetableGridOrganismComponent } from '../timetable-grid-organism/timetable-grid-organism.component';

@Component({
  selector: 'app-reportes-module-organism',
  standalone: true,
  imports: [CommonModule, FormsModule, TimetableGridOrganismComponent],
  template: `
    <div class="md-tabs">
      <button class="md-tab" [class.active]="subTab() === 'horario'" (click)="subTab.set('horario')">
        <span class="material-icons">calendar_view_week</span> RF-19 Horario por Docente / Espacio / Sección
      </button>
      @if (!sigh.isDocente()) {
        <button class="md-tab" [class.active]="subTab() === 'carga'" (click)="subTab.set('carga')">
          <span class="material-icons">bar_chart</span> RF-20 Carga Docente vs Contrato (RN-05, RN-22)
        </button>
      }
      @if (sigh.isAdmin() || sigh.isCoordinador()) {
        <button class="md-tab" [class.active]="subTab() === 'riesgo'" (click)="subTab.set('riesgo')">
          <span class="material-icons">warning_amber</span> RF-21 Secciones en Riesgo de Cierre (RN-21)
        </button>
      }
      @if (!sigh.isDocente()) {
        <button class="md-tab" [class.active]="subTab() === 'alertas'" (click)="subTab.set('alertas')">
          <span class="material-icons">rule_folder</span> RF-22 Sesiones Faltantes y Días Consecutivos (RN-20)
        </button>
      }
    </div>

    <!-- RF-19: HORARIO POR DOCENTE, ESPACIO Y SECCIÓN -->
    @if (subTab() === 'horario') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">filter_alt</span> RF-19 | Consulta de Horario (Vista v_horario)</h3>
            <p class="md-card-subtitle">
              @if (sigh.isDocente()) {
                Consultando automáticamente el horario asignado a su perfil docente.
              } @else {
                Filtra por versión, docente, espacio físico o sección académica.
              }
            </p>
          </div>
        </div>
        @if (!sigh.isDocente()) {
          <div class="md-form-grid" style="margin-bottom: 16px">
            <div class="md-field">
              <label>Versión de Horario</label>
              <select class="md-select" [ngModel]="sigh.selectedVersionId()" (ngModelChange)="cambiarVersionReporte($event)">
                @for (v of sigh.versiones(); track v.idVersion) {
                  <option [ngValue]="v.idVersion">v{{ v.numeroVersion }} ({{ v.estado }})</option>
                }
              </select>
            </div>
            @if (sigh.isAdmin() || sigh.isCoordinador()) {
              <div class="md-field">
                <label>Filtrar por Docente</label>
                <select class="md-select" [(ngModel)]="filtroHorario.idDocente" (ngModelChange)="aplicarFiltroHorario()">
                  <option [ngValue]="null">— Todos los docentes —</option>
                  @for (d of sigh.docentes(); track d.idDocente) {
                    <option [ngValue]="d.idDocente">{{ d.nombres }} {{ d.apellidos }}</option>
                  }
                </select>
              </div>
              <div class="md-field">
                <label>Filtrar por Espacio</label>
                <select class="md-select" [(ngModel)]="filtroHorario.idEspacio" (ngModelChange)="aplicarFiltroHorario()">
                  <option [ngValue]="null">— Todos los espacios —</option>
                  @for (e of sigh.espacios(); track e.idEspacio) {
                    <option [ngValue]="e.idEspacio">{{ e.codigo }} - {{ e.nombre }}</option>
                  }
                </select>
              </div>
              <div class="md-field">
                <label>Filtrar por Sección</label>
                <select class="md-select" [(ngModel)]="filtroHorario.idSeccion" (ngModelChange)="aplicarFiltroHorario()">
                  <option [ngValue]="null">— Todas las secciones —</option>
                  @for (s of sigh.secciones(); track s.idSeccion) {
                    <option [ngValue]="s.idSeccion">{{ s.codigoCurso }} - Sec. {{ s.numero }}</option>
                  }
                </select>
              </div>
              <div>
                <button class="md-btn md-btn-outlined" (click)="limpiarFiltrosHorario()">
                  <span class="material-icons">restart_alt</span> Limpiar Filtros
                </button>
              </div>
            }
          </div>
        }

        <app-timetable-grid-organism
          [franjas]="sigh.franjas()"
          [sesiones]="sigh.reporteHorario()"
          [editable]="false">
        </app-timetable-grid-organism>
      </div>

      <div class="md-card">
        <div class="md-card-header">
          <h3 class="md-card-title"><span class="material-icons">table_rows</span> Detalle Tabular del Horario ({{ sigh.reporteHorario().length }} sesiones)</h3>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Asig.</th>
                <th>Período / Versión</th>
                <th>Curso y Sección</th>
                <th>Docente</th>
                <th>Espacio</th>
                <th>Día y Franja</th>
              </tr>
            </thead>
            <tbody>
              @for (h of sigh.reporteHorario(); track h.idAsignacion) {
                <tr>
                  <td>#{{ h.idAsignacion }}</td>
                  <td>{{ h.periodo }} — v{{ h.numeroVersion }} ({{ h.estadoVersion }})</td>
                  <td><strong>{{ h.codigoCurso }}</strong> - {{ h.nombreCurso }} (Sec. {{ h.numeroSeccion }})</td>
                  <td>{{ h.docente }}</td>
                  <td><span class="md-chip md-chip-info">{{ h.codigoEspacio }} ({{ h.tipoEspacio }})</span></td>
                  <td><strong>{{ h.nombreDia }}</strong> {{ h.horaInicio }} - {{ h.horaFin }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">No se encontraron sesiones con los filtros seleccionados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-20: CARGA HORARIA DOCENTE VS CONTRATO -->
    @if (subTab() === 'carga') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">assessment</span>
              RF-20 | Carga Horaria Docente frente a Horas Mínimas y Máximas de Contrato (v_carga_docente)
            </h3>
            <p class="md-card-subtitle">
              Verifica el cumplimiento de RN-05 (límite máximo duro) y RN-22 (alerta blanda si no alcanza el mínimo de su contrato).
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center">
            <select class="md-select" style="width: 210px" [(ngModel)]="filtroEstadoCarga" (ngModelChange)="filtrarCarga()">
              <option value="">— Todos los estados —</option>
              <option value="BAJO_MINIMO">BAJO_MINIMO (RN-22)</option>
              <option value="EN_RANGO">EN_RANGO</option>
              <option value="EN_LIMITE">EN_LIMITE</option>
            </select>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Docente</th>
                <th>Docente</th>
                <th>Tipo de Contrato</th>
                <th>Sesiones (2h)</th>
                <th>Carga Asignada</th>
                <th>Rango Contrato (Mín–Máx)</th>
                <th>Estado de Carga</th>
              </tr>
            </thead>
            <tbody>
              @for (c of sigh.reporteCargaDocente(); track c.idDocente) {
                <tr>
                  <td>#{{ c.idDocente }}</td>
                  <td><strong>{{ c.docente }}</strong></td>
                  <td>{{ c.tipoContrato }}</td>
                  <td>{{ c.sesiones }} sesiones</td>
                  <td><strong>{{ c.cargaAsignada }} h</strong></td>
                  <td>{{ c.horasMin }} h – {{ c.horasMax }} h</td>
                  <td>
                    <span
                      class="md-chip"
                      [ngClass]="
                        c.estadoCarga === 'BAJO_MINIMO'
                          ? 'md-chip-warning'
                          : c.estadoCarga === 'SOBRECARGA'
                            ? 'md-chip-error'
                            : 'md-chip-success'
                      ">
                      {{ c.estadoCarga }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">No hay registros de carga docente para los filtros seleccionados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-21: SECCIONES EN RIESGO DE CIERRE -->
    @if (subTab() === 'riesgo') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">report_problem</span>
              RF-21 | Secciones en Riesgo de Cierre — Matrícula Real &lt; Cupo Mínimo (v_secciones_riesgo_cierre / RN-21)
            </h3>
            <p class="md-card-subtitle">
              Detecta secciones con baja matrícula real para que el Coordinador Académico decida su cierre (RF-10).
            </p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Sección</th>
                <th>Período</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Matrícula Real</th>
                <th>Cupo Mínimo (P-03)</th>
                @if (sigh.isCoordinador()) {
                  <th>Acción Coordinador (RF-10)</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (r of sigh.reporteRiesgoCierre(); track r.idSeccion) {
                <tr>
                  <td>#{{ r.idSeccion }}</td>
                  <td>{{ r.periodo }}</td>
                  <td><strong>{{ r.codigoCurso }}</strong> - {{ r.nombreCurso }}</td>
                  <td>Sec. {{ r.numeroSeccion }}</td>
                  <td><span class="md-chip md-chip-error">{{ r.matriculaReal }} inscritos</span></td>
                  <td>{{ r.cupoMin }} mín.</td>
                  @if (sigh.isCoordinador()) {
                    <td>
                      <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.cerrarSeccion(r.idSeccion)">
                        <span class="material-icons">lock</span> Cerrar Sección
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="sigh.isCoordinador() ? 7 : 6">No hay secciones en riesgo de cierre actualmente.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-22: SESIONES FALTANTES Y DÍAS CONSECUTIVOS -->
    @if (subTab() === 'alertas') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">pending_actions</span>
              RF-22 | Secciones con Sesiones Faltantes respecto a su Frecuencia Semanal (v_secciones_sesiones_faltantes)
            </h3>
            <p class="md-card-subtitle">Secciones que aún tienen menos sesiones programadas que la frecuencia semanal de su curso (RN-09).</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Sección</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Frecuencia Semanal</th>
                <th>Sesiones Asignadas</th>
                <th>Sesiones Faltantes</th>
              </tr>
            </thead>
            <tbody>
              @for (sf of sigh.reporteSesionesFaltantes(); track sf.idSeccion) {
                <tr>
                  <td>#{{ sf.idSeccion }}</td>
                  <td><strong>{{ sf.codigoCurso }}</strong></td>
                  <td>Sec. {{ sf.numeroSeccion }}</td>
                  <td>{{ sf.frecuenciaSemanal }} sesiones/sem</td>
                  <td>{{ sf.sesionesAsignadas }}</td>
                  <td><span class="md-chip md-chip-warning">Faltan {{ sf.sesionesFaltantes }}</span></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">Todas las secciones cumplen su frecuencia semanal en esta versión.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">date_range</span>
              RF-22 | Secciones con Sesiones en Días Consecutivos — Regla Blanda RN-20 (v_sesiones_dias_consecutivos)
            </h3>
            <p class="md-card-subtitle">Advertencia pedagógica (RN-20): cursos con sesiones programadas en días seguidos.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Sección</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Día 1</th>
                <th>Día 2 (Consecutivo)</th>
              </tr>
            </thead>
            <tbody>
              @for (dc of sigh.reporteDiasConsecutivos(); track $index) {
                <tr>
                  <td>#{{ dc.idSeccion }}</td>
                  <td><strong>{{ dc.codigoCurso }}</strong></td>
                  <td>Sec. {{ dc.numeroSeccion }}</td>
                  <td><span class="md-chip md-chip-warning">{{ dc.dia1 }}</span></td>
                  <td><span class="md-chip md-chip-warning">{{ dc.dia2 }}</span></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">Ninguna sección tiene sesiones en días consecutivos en esta versión.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class ReportesModuleOrganismComponent {
  readonly sigh = inject(SighController);
  readonly subTab = signal<'horario' | 'carga' | 'riesgo' | 'alertas'>('horario');

  filtroHorario: {
    idDocente: number | null;
    idEspacio: number | null;
    idSeccion: number | null;
  } = {
    idDocente: null,
    idEspacio: null,
    idSeccion: null
  };

  filtroEstadoCarga = '';

  cambiarVersionReporte(idVersion: number): void {
    this.sigh.seleccionarVersion(Number(idVersion));
    this.sigh.cargarTodosLosReportes();
  }

  aplicarFiltroHorario(): void {
    this.sigh.consultarHorarioReporte({
      idVersion: this.sigh.selectedVersionId(),
      idDocente: this.filtroHorario.idDocente,
      idEspacio: this.filtroHorario.idEspacio,
      idSeccion: this.filtroHorario.idSeccion
    });
  }

  limpiarFiltrosHorario(): void {
    this.filtroHorario = { idDocente: null, idEspacio: null, idSeccion: null };
    this.aplicarFiltroHorario();
  }

  filtrarCarga(): void {
    this.sigh.filtrarCargaDocente(
      this.sigh.selectedVersionId(),
      null,
      this.filtroEstadoCarga || null
    );
  }
}
