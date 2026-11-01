import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SighController } from '../../../controllers/sigh.controller';
import { TimetableGridOrganismComponent } from '../timetable-grid-organism/timetable-grid-organism.component';
import { Franja, HorarioDetalle } from '../../../models/sigh.models';

@Component({
  selector: 'app-programacion-module-organism',
  standalone: true,
  imports: [CommonModule, FormsModule, TimetableGridOrganismComponent],
  template: `
    <!-- RF-12, RF-15, RF-16, RF-17, RF-18: FLUJO DE VERSIONES DE HORARIO -->
    <div class="md-card">
      <div class="md-card-header">
        <div>
          <h3 class="md-card-title">
            <span class="material-icons">account_tree</span>
            RF-12 a RF-18 | Gestión de Versiones y Flujo de Aprobación (RN-16, RN-17)
          </h3>
          <p class="md-card-subtitle">
            Flujo de estados: <strong>EN_EDICION → PENDIENTE → AVALADO → SINCRONIZADO</strong> (con devolución a EN_EDICION o clonación RF-18).
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
          <button class="md-btn md-btn-filled" (click)="crearNuevaVersion()">
            <span class="material-icons">add</span> RF-12 Nueva Versión (EN_EDICION)
          </button>
        </div>
      </div>

      <!-- Barra de Versión Activa y Botones del Flujo (RF-15, RF-16, RF-17, RF-18) -->
      <div class="version-bar">
        <div class="md-field" style="min-width: 260px">
          <label>Versión de Horario Activa</label>
          <select
            class="md-select"
            [ngModel]="sigh.selectedVersionId()"
            (ngModelChange)="sigh.seleccionarVersion($event)">
            @for (v of sigh.versiones(); track v.idVersion) {
              <option [ngValue]="v.idVersion">
                Versión v{{ v.numeroVersion }} ({{ v.codigoPeriodo || 'Período #' + v.idPeriodo }}) — [{{ v.estado }}]
              </option>
            }
          </select>
        </div>

        @if (sigh.selectedVersion(); as ver) {
          <div class="version-meta">
            <span
              class="md-chip"
              [ngClass]="
                ver.estado === 'EN_EDICION'
                  ? 'md-chip-info'
                  : ver.estado === 'PENDIENTE'
                    ? 'md-chip-warning'
                    : 'md-chip-success'
              ">
              <span class="material-icons" style="font-size: 15px">verified_user</span>
              Estado: {{ ver.estado }}
            </span>

            @if (ver.nombreUsuarioAval) {
              <span class="md-chip md-chip-neutral">Avalado por: {{ ver.nombreUsuarioAval }}</span>
            }
            @if (ver.idDocumentoExterno) {
              <span class="md-chip md-chip-success">Doc. Externo: {{ ver.idDocumentoExterno }}</span>
            }
          </div>

          <div class="workflow-actions">
            <!-- RF-15: EN_EDICION -> PENDIENTE -->
            @if (ver.estado === 'EN_EDICION') {
              <button class="md-btn md-btn-warning" (click)="sigh.enviarAAprobacion(ver.idVersion!)">
                <span class="material-icons">send</span> RF-15 Enviar a Aprobación
              </button>
            }

            <!-- RF-16: PENDIENTE -> AVALADO o EN_EDICION -->
            @if (ver.estado === 'PENDIENTE') {
              <button class="md-btn md-btn-success" (click)="sigh.avalarVersion(ver.idVersion!)">
                <span class="material-icons">fact_check</span> RF-16 Avalar Versión (Aprobador)
              </button>
              <button class="md-btn md-btn-outlined" (click)="sigh.devolverVersion(ver.idVersion!)">
                <span class="material-icons">undo</span> RF-16 Devolver a Edición
              </button>
            }

            <!-- RF-17 y RF-18: AVALADO -> SINCRONIZADO o CLONAR -->
            @if (ver.estado === 'AVALADO' || ver.estado === 'SINCRONIZADO') {
              @if (ver.estado === 'AVALADO') {
                <div style="display: flex; gap: 6px; align-items: center">
                  <input
                    class="md-input"
                    style="width: 190px; padding: 6px 10px"
                    [(ngModel)]="idDocumentoExterno"
                    placeholder="ID Doc (Ej. DOC-EXT-2026-01)" />
                  <button class="md-btn md-btn-filled" (click)="sincronizar(ver.idVersion!)">
                    <span class="material-icons">cloud_sync</span> RF-17 Sincronizar
                  </button>
                </div>
              }
              <button class="md-btn md-btn-tonal" (click)="sigh.clonarVersion(ver.idVersion!)">
                <span class="material-icons">content_copy</span> RF-18 Clonar a Nueva Versión
              </button>
            }
          </div>
        }
      </div>
    </div>

    <!-- RF-13 y RF-14: ASIGNAR O MODIFICAR SESIÓN (VALIDACIÓN EN MOTOR POSTGRESQL) -->
    @if (sigh.selectedVersion(); as ver) {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">event_note</span>
              RF-13 & RF-14 | Asignar Sesión en Versión v{{ ver.numeroVersion }} ({{ ver.estado }})
            </h3>
            <p class="md-card-subtitle">
              Cada asignación se guarda al instante y pasa por las 19 reglas duras en PostgreSQL (RN-01 a RN-16: cruces, aforo, horas contrato, habilitación, recursos, disponibilidad).
            </p>
          </div>
          @if (!esEditable()) {
            <span class="md-chip md-chip-error">
              <span class="material-icons" style="font-size: 15px">lock</span>
              RN-16: Versión {{ ver.estado }} es inmutable
            </span>
          }
        </div>

        <div class="md-form-grid">
          <div class="md-field">
            <label>Sección Abierta (Curso / Cupo)</label>
            <select class="md-select" [(ngModel)]="formAsignacion.idSeccion">
              @for (s of sigh.secciones(); track s.idSeccion) {
                <option [ngValue]="s.idSeccion">
                  #{{ s.idSeccion }} | {{ s.codigoCurso }} Sec. {{ s.numero }} ({{ s.nombreCurso }}) — [{{ s.estado }}, Mat: {{ s.matriculaReal ?? s.matriculaProyectada }}]
                </option>
              }
            </select>
          </div>

          <div class="md-field">
            <label>Docente (Valida RN-01, RN-05, RN-12, RN-13)</label>
            <select class="md-select" [(ngModel)]="formAsignacion.idDocente">
              @for (d of sigh.docentes(); track d.idDocente) {
                <option [ngValue]="d.idDocente">
                  #{{ d.idDocente }} | {{ d.nombres }} {{ d.apellidos }} ({{ d.nombreTipoContrato }}: máx {{ d.horasMax }}h)
                </option>
              }
            </select>
          </div>

          <div class="md-field">
            <label>Espacio Físico (Valida RN-02, RN-04, RN-14)</label>
            <select class="md-select" [(ngModel)]="formAsignacion.idEspacio">
              @for (e of sigh.espacios(); track e.idEspacio) {
                <option [ngValue]="e.idEspacio">
                  #{{ e.idEspacio }} | {{ e.codigo }} - {{ e.nombre }} (Cap: {{ e.capacidad }}, {{ e.tipoEspacio }})
                </option>
              }
            </select>
          </div>

          <div class="md-field">
            <label>Franja Horaria 2h (Valida RN-03, RN-06, RN-07)</label>
            <select class="md-select" [(ngModel)]="formAsignacion.idFranja">
              @for (f of sigh.franjas(); track f.idFranja) {
                <option [ngValue]="f.idFranja">
                  #F{{ f.idFranja }} | {{ f.nombreDia }} {{ f.horaInicio }} - {{ f.horaFin }}
                </option>
              }
            </select>
          </div>

          <div>
            <button class="md-btn md-btn-filled" [disabled]="!esEditable()" (click)="asignarSesion()">
              <span class="material-icons">add_task</span> RF-13 Asignar Sesión
            </button>
          </div>
        </div>
      </div>

      <!-- GRILLA SEMANAL INTERACTIVA DRAG & DROP -->
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">grid_on</span>
              Grilla Semanal de Programación — Versión v{{ ver.numeroVersion }} ({{ sigh.horarioGrilla().length }} sesiones asignadas)
            </h3>
            <p class="md-card-subtitle">
              Puedes <strong>arrastrar y soltar (Drag &amp; Drop)</strong> cualquier sesión hacia otra franja para moverla (RF-14), hacer clic en una celda para elegir esa franja, o eliminarla.
            </p>
          </div>
        </div>

        <app-timetable-grid-organism
          [franjas]="sigh.franjas()"
          [sesiones]="sigh.horarioGrilla()"
          [editable]="esEditable()"
          (selectSlot)="alSeleccionarFranjaEnGrilla($event)"
          (moveSession)="alMoverSesionEnGrilla($event)"
          (deleteSession)="sigh.eliminarAsignacion($event)">
        </app-timetable-grid-organism>
      </div>
    }
  `,
  styles: [`
    .version-bar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      background: #f8fafc;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid var(--md-outline-light);
    }
    .version-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-bottom: 4px;
    }
    .workflow-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  `]
})
export class ProgramacionModuleOrganismComponent implements OnInit {
  readonly sigh = inject(SighController);

  idDocumentoExterno = 'DOC-EXT-2026-0001';

  formAsignacion = {
    idSeccion: 1,
    idDocente: 1,
    idEspacio: 1,
    idFranja: 1
  };

  readonly esEditable = computed(() => {
    const estado = this.sigh.selectedVersion()?.estado;
    return estado === 'EN_EDICION' || estado === 'PENDIENTE';
  });

  ngOnInit(): void {
    const s = this.sigh.secciones()[0];
    if (s?.idSeccion) this.formAsignacion.idSeccion = s.idSeccion;
    const d = this.sigh.docentes()[0];
    if (d?.idDocente) this.formAsignacion.idDocente = d.idDocente;
    const e = this.sigh.espacios()[0];
    if (e?.idEspacio) this.formAsignacion.idEspacio = e.idEspacio;
    const f = this.sigh.franjas()[0];
    if (f?.idFranja) this.formAsignacion.idFranja = f.idFranja;
  }

  crearNuevaVersion(): void {
    const pid = this.sigh.selectedPeriodoId() || 1;
    this.sigh.crearVersion(pid);
  }

  sincronizar(idVersion: number): void {
    if (!this.idDocumentoExterno.trim()) return;
    this.sigh.sincronizarVersion(idVersion, this.idDocumentoExterno.trim());
  }

  asignarSesion(): void {
    const vid = this.sigh.selectedVersionId();
    if (!vid) return;
    this.sigh.crearAsignacion({
      idVersion: vid,
      idSeccion: Number(this.formAsignacion.idSeccion),
      idDocente: Number(this.formAsignacion.idDocente),
      idEspacio: Number(this.formAsignacion.idEspacio),
      idFranja: Number(this.formAsignacion.idFranja)
    });
  }

  alSeleccionarFranjaEnGrilla(franja: Franja): void {
    this.formAsignacion.idFranja = franja.idFranja;
    this.sigh.showSuccess(
      'Franja seleccionada en grilla',
      `Se preseleccionó la franja #F${franja.idFranja} (${franja.nombreDia} ${franja.horaInicio}-${franja.horaFin}) en el formulario.`
    );
  }

  alMoverSesionEnGrilla(evento: { sesion: HorarioDetalle; nuevaFranjaId: number }): void {
    this.sigh.moverAsignacion(evento.sesion.idAsignacion, {
      idSeccion: evento.sesion.idSeccion,
      idDocente: evento.sesion.idDocente,
      idEspacio: evento.sesion.idEspacio,
      idFranja: evento.nuevaFranjaId
    });
  }
}
