import { Component, OnInit, inject, signal } from '@angular/core';
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
      <button class="md-tab" [class.active]="subTab() === 'secciones'" (click)="subTab.set('secciones')">
        <span class="material-icons">class</span> RF-09 / RF-10 Secciones, Sobrecupos y Matrícula Real
      </button>
      <button class="md-tab" [class.active]="subTab() === 'disponibilidad'" (click)="abrirTabDisponibilidad()">
        <span class="material-icons">event_available</span> RF-11 Disponibilidad Horaria de Docentes
      </button>
    </div>

    <!-- RF-09 y RF-10: SECCIONES, MATRÍCULA REAL Y CIERRE -->
    @if (subTab() === 'secciones') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">add_box</span> RF-09 | Abrir Nueva Sección en Período</h3>
            <p class="md-card-subtitle">
              Regla RN-10: El cupo máximo debe estar entre el mínimo (10) y 44. Si supera el cupo estándar (40), PostgreSQL exige justificación de sobrecupo.
            </p>
          </div>
        </div>
        <div class="md-form-grid">
          <div class="md-field">
            <label>Curso</label>
            <select class="md-select" [(ngModel)]="nuevaSeccion.idCurso">
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

      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">view_list</span>
              RF-09 & RF-10 | Secciones del Período ({{ sigh.secciones().length }})
            </h3>
            <p class="md-card-subtitle">Registra la matrícula real (RF-10) o cierra las secciones que no alcancen el cupo mínimo (RN-11, RN-21).</p>
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
                <th>Acciones RF-10</th>
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
                        [ngModel]="s.matriculaReal ?? s.matriculaProyectada"
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
                  <td>
                    @if (s.estado === 'ABIERTA') {
                      <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.cerrarSeccion(s.idSeccion!)">
                        <span class="material-icons">lock</span> Cerrar
                      </button>
                    } @else {
                      <button class="md-btn md-btn-outlined md-btn-sm" (click)="sigh.reabrirSeccion(s.idSeccion!)">
                        <span class="material-icons">lock_open</span> Reabrir
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">No hay secciones registradas para este período.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-11: DISPONIBILIDAD HORARIA DOCENTE -->
    @if (subTab() === 'disponibilidad') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title">
              <span class="material-icons">event_busy</span>
              RF-11 | Matriz de Disponibilidad Horaria por Docente y Período (RN-13, RN-19, S-04)
            </h3>
            <p class="md-card-subtitle">
              Haz clic sobre cualquier franja para alternar entre <strong>DISPONIBLE</strong> y <strong>NO DISPONIBLE</strong>. La BD impedirá asignar sesiones en franjas marcadas como NO DISPONIBLE (RN-13).
            </p>
          </div>
          <div style="min-width: 280px">
            <label style="font-size: 0.78rem; font-weight: 500; color: var(--md-text-secondary); display: block; margin-bottom: 4px">
              Docente a configurar:
            </label>
            <select class="md-select" [ngModel]="docenteDispId()" (ngModelChange)="cambiarDocenteDisponibilidad($event)">
              @for (d of sigh.docentes(); track d.idDocente) {
                <option [ngValue]="d.idDocente">#{{ d.idDocente }} - {{ d.nombres }} {{ d.apellidos }} ({{ d.nombreTipoContrato }})</option>
              }
            </select>
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
                        <button
                          type="button"
                          class="md-btn md-btn-sm"
                          [ngClass]="noDisp ? 'md-btn-danger' : 'md-btn-success'"
                          (click)="toggleFranja(franja.idFranja)">
                          <span class="material-icons">{{ noDisp ? 'block' : 'check_circle' }}</span>
                          {{ noDisp ? 'NO DISPONIBLE' : 'DISPONIBLE' }}
                        </button>
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
  readonly docenteDispId = signal<number>(1);

  matriculaDraft: Record<number, number> = {};

  nuevaSeccion: Seccion = {
    idCurso: 1,
    idPeriodo: 1,
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

  ngOnInit(): void {
    const firstCourse = this.sigh.cursos()[0];
    if (firstCourse?.idCurso) this.nuevaSeccion.idCurso = firstCourse.idCurso;
    const firstDoc = this.sigh.docentes()[0];
    if (firstDoc?.idDocente) this.docenteDispId.set(firstDoc.idDocente);
  }

  crearSeccion(): void {
    const pid = this.sigh.selectedPeriodoId() || 1;
    this.sigh.crearSeccion({
      ...this.nuevaSeccion,
      idPeriodo: pid,
      justificacionSobrecupo: this.nuevaSeccion.justificacionSobrecupo?.trim() || null
    });
  }

  guardarMatriculaReal(s: Seccion): void {
    if (!s.idSeccion) return;
    const val = this.matriculaDraft[s.idSeccion] ?? s.matriculaReal ?? s.matriculaProyectada;
    this.sigh.registrarMatriculaReal(s.idSeccion, Number(val));
  }

  abrirTabDisponibilidad(): void {
    this.subTab.set('disponibilidad');
    const pid = this.sigh.selectedPeriodoId() || 1;
    this.sigh.cargarDisponibilidad(this.docenteDispId(), pid);
  }

  cambiarDocenteDisponibilidad(idDocente: number): void {
    this.docenteDispId.set(Number(idDocente));
    const pid = this.sigh.selectedPeriodoId() || 1;
    this.sigh.cargarDisponibilidad(Number(idDocente), pid);
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
    const pid = this.sigh.selectedPeriodoId() || 1;
    this.sigh.toggleDisponibilidadFranja(this.docenteDispId(), pid, idFranja);
  }
}
