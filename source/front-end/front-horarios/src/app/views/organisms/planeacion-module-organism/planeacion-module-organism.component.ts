import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SighController } from '../../../controllers/sigh.controller';
import { Franja, Seccion } from '../../../models/sigh.models';

@Component({
  selector: 'app-planeacion-module-organism',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="md-tabs">
      @if (sigh.isAdmin() || sigh.isCoordinador()) {
        <button class="md-tab" [class.active]="subTab() === 'secciones'" (click)="subTab.set('secciones')">
          <span class="material-icons">class</span> RF-09 / RF-10 Secciones, Sobrecupos y Matrícula Real
        </button>
      }
      @if (sigh.isCoordinador() || sigh.isDocente()) {
        <button class="md-tab" [class.active]="subTab() === 'disponibilidad'" (click)="abrirTabDisponibilidad()">
          <span class="material-icons">event_available</span> RF-11 Disponibilidad Horaria de Docentes
        </button>
      }
    </div>

    <!-- RF-09 y RF-10: SECCIONES, MATRÍCULA REAL Y CIERRE -->
    @if (subTab() === 'secciones' && (sigh.isAdmin() || sigh.isCoordinador())) {
      @if (sigh.isCoordinador()) {
        <div class="md-card">
          <div class="md-card-header">
            <div>
              <h3 class="md-card-title"><span class="material-icons">add_box</span> RF-09 | Abrir Nueva Sección en Período</h3>
              <p class="md-card-subtitle">
                Regla RN-10: El cupo máximo debe estar entre el mínimo (10) y 44. Si supera el cupo estándar (40), la base de datos exige justificación de sobrecupo.
              </p>
            </div>
          </div>
          <div class="md-form-grid">
            <div class="md-field">
              <label>Curso</label>
              <select class="md-select" [(ngModel)]="nuevaSeccion.idCurso">
                <option [ngValue]="null" disabled>— Seleccione un curso —</option>
                @for (c of sigh.cursos(); track c.idCurso) {
                  <option [ngValue]="c.idCurso">{{ c.codigo }} - {{ c.nombre }}</option>
                }
              </select>
            </div>
            <div class="md-field">
              <label>Número de Sección (S-13)</label>
              <input type="number" min="1" class="md-input" [(ngModel)]="nuevaSeccion.numero" />
            </div>
            <div class="md-field">
              <label>Cupo Mínimo (P-03)</label>
              <input type="number" min="1" class="md-input" [(ngModel)]="nuevaSeccion.cupoMin" />
            </div>
            <div class="md-field">
              <label>Cupo Máximo (P-01: 40 / P-02: hasta 44)</label>
              <input type="number" min="1" max="50" class="md-input" [(ngModel)]="nuevaSeccion.cupoMax" />
            </div>
            <div class="md-field">
              <label>Matrícula Proyectada</label>
              <input type="number" min="0" class="md-input" [(ngModel)]="nuevaSeccion.matriculaProyectada" />
            </div>
            <div class="md-field" style="grid-column: span 2">
              <label>Justificación de Sobrecupo (Obligatoria si Cupo Máximo &gt; 40 — RN-10)</label>
              <input
                class="md-input"
                [(ngModel)]="nuevaSeccion.justificacionSobrecupo"
                placeholder="Ej. Alta demanda autorizada por coordinación académica" />
            </div>
            <div>
              <button class="md-btn md-btn-filled" (click)="crearSeccion()">
                <span class="material-icons">add_circle</span> Abrir Sección
              </button>
            </div>
          </div>
        </div>
      }

      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">view_list</span>
              RF-09 & RF-10 | Secciones del Período ({{ sigh.secciones().length }})
            </h3>
            <p class="md-card-subtitle">
              {{ sigh.isAdmin() ? 'Registra la matrícula real desde los sistemas fuente (CU-03 / RF-10).' : 'Registra la matrícula real (RF-10) o cierra las secciones que no alcancen el cupo mínimo (RN-11, RN-21).' }}
            </p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Cupo Mín / Máx</th>
                <th>Proyectada</th>
                <th>Matrícula Real (RF-10)</th>
                <th>Sobrecupo (RN-10)</th>
                <th>Estado</th>
                @if (sigh.isCoordinador()) {
                  <th>Acciones RF-10</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (s of sigh.secciones(); track s.idSeccion) {
                <tr>
                  <td>#{{ s.idSeccion }}</td>
                  <td><strong>{{ s.codigoCurso }}</strong> - {{ s.nombreCurso }}</td>
                  <td>Sec. {{ s.numero }}</td>
                  <td>{{ s.cupoMin }} / <strong>{{ s.cupoMax }}</strong></td>
                  <td>{{ s.matriculaProyectada }}</td>
                  <td style="min-width: 170px">
                    <div style="display: flex; gap: 6px; align-items: center">
                      <input
                        type="number"
                        min="0"
                        class="md-input"
                        style="width: 80px; padding: 5px 8px"
                        placeholder="Sin dato"
                        [ngModel]="matriculaDraft[s.idSeccion!] ?? s.matriculaReal"
                        (ngModelChange)="matriculaDraft[s.idSeccion!] = $event" />
                      <button
                        class="md-btn md-btn-tonal md-btn-sm"
                        (click)="guardarMatriculaReal(s)">
                        Guardar
                      </button>
                    </div>
                  </td>
                  <td>
                    @if (s.justificacionSobrecupo) {
                      <span class="md-chip md-chip-warning" [title]="s.justificacionSobrecupo">Con justificación</span>
                    } @else {
                      <span style="color: #94a3b8">Estándar</span>
                    }
                  </td>
                  <td>
                    <span class="md-chip" [ngClass]="s.estado === 'ABIERTA' ? 'md-chip-success' : 'md-chip-error'">
                      {{ s.estado }}
                    </span>
                    @if (s.matriculaReal !== null && s.matriculaReal !== undefined && s.matriculaReal < s.cupoMin && s.estado === 'ABIERTA') {
                      <span class="md-chip md-chip-warning" style="margin-left: 4px" title="RN-21: Matrícula real menor al cupo mínimo">
                        Riesgo Cierre
                      </span>
                    }
                  </td>
                  @if (sigh.isCoordinador()) {
                    <td>
                      @if (s.estado === 'ABIERTA') {
                        <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.cerrarSeccion(s.idSeccion!)">
                          <span class="material-icons">lock</span> Cerrar
                        </button>
                      } @else {
                        <span style="color: #94a3b8">—</span>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="sigh.isCoordinador() ? 9 : 8">No hay secciones registradas para este período.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-11: DISPONIBILIDAD HORARIA DOCENTE (Edición exclusiva del propio DOCENTE RN-19; Lectura para COORDINADOR) -->
    @if (subTab() === 'disponibilidad' && (sigh.isCoordinador() || sigh.isDocente())) {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">event_busy</span>
              RF-11 | Matriz de Disponibilidad Horaria por Docente y Período (RN-13, RN-19, S-04)
            </h3>
            <p class="md-card-subtitle">
              @if (sigh.isDocente()) {
                Haz clic sobre cualquier franja para alternar entre <strong>DISPONIBLE</strong> y <strong>NO DISPONIBLE</strong>. Solo puedes ver y modificar tu propia disponibilidad (RN-19 / RLS).
              } @else {
                Modo consulta para Coordinación Académica: visualiza las franjas marcadas como <strong>NO DISPONIBLE</strong> por cada docente antes de programar (RN-09, RN-19).
              }
            </p>
          </div>
          <div style="min-width: 280px">
            @if (sigh.isDocente()) {
              @if (docenteDispId()) {
                <span class="md-chip md-chip-info">
                  <span class="material-icons" style="font-size: 16px">person</span>
                  Docente: {{ sigh.activeUser()?.nombreDocente || sigh.activeUser()?.nombreUsuario }} (#{{ docenteDispId() }})
                </span>
              } @else {
                <span class="md-chip md-chip-error">
                  <span class="material-icons" style="font-size: 16px">link_off</span>
                  Tu usuario no está vinculado a un docente (S-09). Pide al Administrador que lo vincule.
                </span>
              }
            } @else {
              <label style="font-size: 0.78rem; font-weight: 500; color: var(--md-text-secondary); display: block; margin-bottom: 4px">
                Docente a consultar:
              </label>
              <select class="md-select" [ngModel]="docenteDispId()" (ngModelChange)="cambiarDocenteDisponibilidad($event)">
                <option [ngValue]="null" disabled>— Seleccione un docente —</option>
                @for (d of sigh.docentes(); track d.idDocente) {
                  <option [ngValue]="d.idDocente">#{{ d.idDocente }} - {{ d.nombres }} {{ d.apellidos }} ({{ d.nombreTipoContrato }})</option>
                }
              </select>
            }
          </div>
        </div>

        <div class="md-table-container">
          <table class="md-table" style="text-align: center">
            <thead>
              <tr>
                <th>Hora / Franja</th>
                @for (day of days; track day.dia) {
                  <th style="text-align: center">{{ day.nombre }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (hora of horas; track hora) {
                <tr>
                  <td><strong>{{ hora }}</strong></td>
                  @for (day of days; track day.dia) {
                    @let franja = buscarFranja(day.dia, hora);
                    <td>
                      @if (franja) {
                        @let noDisp = esNoDisponible(franja.idFranja);
                        @if (sigh.isDocente()) {
                          <button
                            type="button"
                            class="md-btn md-btn-sm"
                            [ngClass]="noDisp ? 'md-btn-danger' : 'md-btn-success'"
                            (click)="toggleFranja(franja.idFranja)">
                            <span class="material-icons">{{ noDisp ? 'block' : 'check_circle' }}</span>
                            {{ noDisp ? 'NO DISPONIBLE' : 'DISPONIBLE' }}
                          </button>
                        } @else {
                          <span class="md-chip" [ngClass]="noDisp ? 'md-chip-error' : 'md-chip-success'">
                            <span class="material-icons" style="font-size: 14px">{{ noDisp ? 'block' : 'check_circle' }}</span>
                            {{ noDisp ? 'NO DISPONIBLE' : 'DISPONIBLE' }}
                          </span>
                        }
                      } @else {
                        <span style="color: #cbd5e1; font-size: 0.75rem">—</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class PlaneacionModuleOrganismComponent implements OnInit {
  readonly sigh = inject(SighController);
  readonly subTab = signal<'secciones' | 'disponibilidad'>('secciones');
  /** Docente cuya disponibilidad se muestra. null = ninguno elegido (o docente sin vínculo S-09). */
  readonly docenteDispId = signal<number | null>(null);

  /** Valores escritos en la columna "Matrícula Real" que aún no se han guardado. */
  matriculaDraft: Record<number, number | null> = {};

  nuevaSeccion: Omit<Seccion, 'idCurso' | 'idPeriodo'> & { idCurso: number | null } = {
    idCurso: null,
    numero: 1,
    cupoMin: 10,
    cupoMax: 35,
    matriculaProyectada: 30,
    justificacionSobrecupo: '',
    estado: 'ABIERTA'
  };

  readonly days = [
    { dia: 1, nombre: 'Lunes' },
    { dia: 2, nombre: 'Martes' },
    { dia: 3, nombre: 'Miércoles' },
    { dia: 4, nombre: 'Jueves' },
    { dia: 5, nombre: 'Viernes' },
    { dia: 6, nombre: 'Sábado' }
  ];

  readonly horas = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

  constructor() {
    // Recarga la disponibilidad cuando cambia el docente elegido o el período del
    // selector superior, mientras la pestaña de disponibilidad esté abierta.
    effect(() => {
      const tab = this.subTab();
      const idDocente = this.docenteDispId();
      const idPeriodo = this.sigh.selectedPeriodoId();
      if (tab !== 'disponibilidad') return;
      untracked(() => {
        if (idDocente && idPeriodo) {
          this.sigh.cargarDisponibilidad(idDocente, idPeriodo);
        } else {
          this.sigh.disponibilidades.set([]);
        }
      });
    });

    // Al cambiar de período se descartan las matrículas escritas y no guardadas.
    effect(() => {
      this.sigh.selectedPeriodoId();
      untracked(() => (this.matriculaDraft = {}));
    });
  }

  ngOnInit(): void {
    const firstCourse = this.sigh.cursos()[0];
    if (firstCourse?.idCurso) this.nuevaSeccion.idCurso = firstCourse.idCurso;

    if (this.sigh.isDocente()) {
      // Solo su propio docente (RN-19). Si el usuario no tiene vínculo, queda en null.
      this.docenteDispId.set(this.sigh.activeUser()?.idDocente ?? null);
      this.subTab.set('disponibilidad');
    } else {
      const firstDoc = this.sigh.docentes()[0];
      if (firstDoc?.idDocente) this.docenteDispId.set(firstDoc.idDocente);
    }
  }

  crearSeccion(): void {
    const pid = this.sigh.selectedPeriodoId();
    if (!pid) {
      this.sigh.alert.set({ type: 'warning', title: 'Falta el período', message: 'Selecciona un período en la barra superior.' });
      return;
    }
    if (!this.nuevaSeccion.idCurso) {
      this.sigh.alert.set({ type: 'warning', title: 'Falta el curso', message: 'Selecciona el curso de la nueva sección.' });
      return;
    }
    this.sigh.crearSeccion({
      ...this.nuevaSeccion,
      idCurso: this.nuevaSeccion.idCurso,
      idPeriodo: pid,
      justificacionSobrecupo: this.nuevaSeccion.justificacionSobrecupo?.trim() || null
    });
  }

  guardarMatriculaReal(s: Seccion): void {
    if (!s.idSeccion) return;
    const escrito = this.matriculaDraft[s.idSeccion];
    const val = escrito ?? s.matriculaReal;
    // Nunca se guarda la proyectada como si fuera real: si no hay dato escrito, no se envía nada.
    if (val === null || val === undefined || String(val).trim() === '') {
      this.sigh.alert.set({
        type: 'warning',
        title: 'RF-10 | Falta la matrícula real',
        message: `Escribe la matrícula real de la sección #${s.numero} antes de guardar.`
      });
      return;
    }
    const numero = Number(val);
    if (!Number.isInteger(numero) || numero < 0) {
      this.sigh.alert.set({
        type: 'warning',
        title: 'RF-10 | Valor no válido',
        message: 'La matrícula real debe ser un número entero mayor o igual a 0.'
      });
      return;
    }
    delete this.matriculaDraft[s.idSeccion];
    this.sigh.registrarMatriculaReal(s.idSeccion, numero);
  }

  abrirTabDisponibilidad(): void {
    this.subTab.set('disponibilidad');
  }

  cambiarDocenteDisponibilidad(idDocente: number): void {
    this.docenteDispId.set(Number(idDocente));
  }

  buscarFranja(diaSemana: number, horaPrefix: string): Franja | undefined {
    return this.sigh.franjas().find(
      (f) => f.diaSemana === diaSemana && String(f.horaInicio).startsWith(horaPrefix)
    );
  }

  esNoDisponible(idFranja: number): boolean {
    return this.sigh.disponibilidades().some(
      (d) => d.idFranja === idFranja && d.tipo === 'NO_DISPONIBLE'
    );
  }

  toggleFranja(idFranja: number): void {
    if (!this.sigh.isDocente()) return;
    const idDocente = this.docenteDispId();
    const idPeriodo = this.sigh.selectedPeriodoId();
    if (!idDocente || !idPeriodo) return;
    this.sigh.toggleDisponibilidadFranja(idDocente, idPeriodo, idFranja);
  }
}
