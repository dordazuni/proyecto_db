import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SighController } from '../../../controllers/sigh.controller';
import { Curso, PeriodoAcademico, Recurso } from '../../../models/sigh.models';

@Component({
  selector: 'app-catalogos-module-organism',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="md-tabs">
      <button class="md-tab" [class.active]="subTab() === 'periodos'" (click)="subTab.set('periodos')">
        <span class="material-icons">calendar_month</span> RF-01 Períodos
      </button>
      <button class="md-tab" [class.active]="subTab() === 'docentes'" (click)="subTab.set('docentes')">
        <span class="material-icons">badge</span> RF-02 / RF-06 Docentes y Contratos
      </button>
      <button class="md-tab" [class.active]="subTab() === 'espacios'" (click)="subTab.set('espacios')">
        <span class="material-icons">meeting_room</span> RF-03 / RF-04 Espacios y Dotación
      </button>
      <button class="md-tab" [class.active]="subTab() === 'cursos'" (click)="subTab.set('cursos')">
        <span class="material-icons">menu_book</span> RF-05 Cursos y Requisitos
      </button>
      <button class="md-tab" [class.active]="subTab() === 'recursos'" (click)="subTab.set('recursos')">
        <span class="material-icons">devices</span> RF-04 Catálogo Recursos
      </button>
      <button class="md-tab" [class.active]="subTab() === 'franjas'" (click)="subTab.set('franjas')">
        <span class="material-icons">schedule</span> RF-07 Franjas (33)
      </button>
      <button class="md-tab" [class.active]="subTab() === 'parametros'" (click)="subTab.set('parametros')">
        <span class="material-icons">tune</span> RF-08 Parámetros
      </button>
    </div>

    <!-- RF-01: PERÍODOS ACADÉMICOS (Escritura exclusiva de ADMINISTRADOR) -->
    @if (subTab() === 'periodos') {
      @if (sigh.isAdmin()) {
        <div class="md-card">
          <div class="md-card-header">
            <div>
              <h3 class="md-card-title"><span class="material-icons">calendar_today</span> RF-01 | Registrar Período Académico</h3>
              <p class="md-card-subtitle">Código (ej. 2026-1), fechas de inicio y fin, y estado del período.</p>
            </div>
          </div>
          <div class="md-form-grid">
            <div class="md-field">
              <label>Código del Período</label>
              <input class="md-input" [(ngModel)]="nuevoPeriodo.codigo" placeholder="Ej. 2026-2" />
            </div>
            <div class="md-field">
              <label>Fecha Inicio</label>
              <input type="date" class="md-input" [(ngModel)]="nuevoPeriodo.fechaInicio" />
            </div>
            <div class="md-field">
              <label>Fecha Fin</label>
              <input type="date" class="md-input" [(ngModel)]="nuevoPeriodo.fechaFin" />
            </div>
            <div class="md-field">
              <label>Estado</label>
              <select class="md-select" [(ngModel)]="nuevoPeriodo.estado">
                <option value="PLANEACION">PLANEACION</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="CERRADO">CERRADO</option>
              </select>
            </div>
            <div>
              <button class="md-btn md-btn-filled" (click)="guardarPeriodo()">
                <span class="material-icons">add</span> Crear Período
              </button>
            </div>
          </div>
        </div>
      }

      <div class="md-card">
        <div class="md-card-header">
          <h3 class="md-card-title"><span class="material-icons">list</span> Períodos Registrados ({{ sigh.periodos().length }})</h3>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                @if (sigh.isAdmin()) {
                  <th>Acciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (p of sigh.periodos(); track p.idPeriodo) {
                <tr>
                  <td>#{{ p.idPeriodo }}</td>
                  <td><strong>{{ p.codigo }}</strong></td>
                  <td>{{ p.fechaInicio }}</td>
                  <td>{{ p.fechaFin }}</td>
                  <td>
                    <span class="md-chip" [ngClass]="p.estado === 'ACTIVO' ? 'md-chip-success' : p.estado === 'PLANEACION' ? 'md-chip-info' : 'md-chip-neutral'">
                      {{ p.estado }}
                    </span>
                  </td>
                  @if (sigh.isAdmin()) {
                    <td>
                      <button class="md-btn md-btn-tonal md-btn-sm" (click)="cambiarEstadoPeriodo(p, 'ACTIVO')">Activar</button>
                      <button class="md-btn md-btn-outlined md-btn-sm" style="margin-left: 6px" (click)="cambiarEstadoPeriodo(p, 'CERRADO')">Cerrar</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-02 y RF-06: DOCENTES, TIPOS DE CONTRATO Y HABILITACIÓN DE CURSOS (Habilitación exclusiva de COORDINADOR) -->
    @if (subTab() === 'docentes') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">work_outline</span> RF-02 | Catálogo de Tipos de Contrato (P-07 / P-08)</h3>
            <p class="md-card-subtitle">Horas mínimas y máximas semanales de clase según tipo de vinculación.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo de Contrato</th>
                <th>Horas Mínimas (RN-22)</th>
                <th>Horas Máximas (RN-05)</th>
              </tr>
            </thead>
            <tbody>
              @for (tc of sigh.tiposContrato(); track tc.idTipoContrato) {
                <tr>
                  <td>#{{ tc.idTipoContrato }}</td>
                  <td><strong>{{ tc.nombre }}</strong></td>
                  <td>{{ tc.horasMin }} h</td>
                  <td><span class="md-chip md-chip-info">{{ tc.horasMax }} h máx</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">school</span> RF-02 & RF-06 | Docentes (Solo lectura RN-19) y Cursos Habilitados (RN-12)</h3>
            <p class="md-card-subtitle">Selecciona un docente para consultar o gestionar qué cursos está habilitado a dictar.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Documento</th>
                <th>Docente</th>
                <th>Email</th>
                <th>Contrato</th>
                <th>Rango Horas</th>
                <th>Estado</th>
                <th>RF-06 Habilitación</th>
              </tr>
            </thead>
            <tbody>
              @for (d of sigh.docentes(); track d.idDocente) {
                <tr>
                  <td>#{{ d.idDocente }}</td>
                  <td>{{ d.tipoDocumento }} {{ d.numeroDocumento }}</td>
                  <td><strong>{{ d.nombres }} {{ d.apellidos }}</strong></td>
                  <td>{{ d.email }}</td>
                  <td>{{ d.nombreTipoContrato }}</td>
                  <td>{{ d.horasMin }}–{{ d.horasMax }} h</td>
                  <td>
                    <span class="md-chip" [ngClass]="d.estadoVinculacion === 'ACTIVO' ? 'md-chip-success' : 'md-chip-neutral'">
                      {{ d.estadoVinculacion }}
                    </span>
                  </td>
                  <td>
                    <button class="md-btn md-btn-tonal md-btn-sm" (click)="seleccionarDocenteHabilitacion(d.idDocente)">
                      <span class="material-icons">rule</span> Cursos que dicta
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (docenteSeleccionadoId()) {
        <div class="md-card">
          <div class="md-card-header">
            <h3 class="md-card-title">
              <span class="material-icons">verified</span>
              RF-06 | Cursos Habilitados para Docente #{{ docenteSeleccionadoId() }} (Regla RN-12)
            </h3>
          </div>
          @if (sigh.isCoordinador()) {
            <div class="md-form-grid" style="margin-bottom: 16px">
              <div class="md-field">
                <label>Seleccionar Curso para Habilitar</label>
                <select class="md-select" [(ngModel)]="cursoParaHabilitarId">
                  <option [ngValue]="null" disabled>— Seleccione un curso —</option>
                  @for (c of sigh.cursos(); track c.idCurso) {
                    <option [ngValue]="c.idCurso">{{ c.codigo }} - {{ c.nombre }}</option>
                  }
                </select>
              </div>
              <div>
                <button class="md-btn md-btn-filled" (click)="habilitarCurso()">
                  <span class="material-icons">add_task</span> Habilitar Curso
                </button>
              </div>
            </div>
          }
          <div class="md-table-container">
            <table class="md-table">
              <thead>
                <tr>
                  <th>ID Curso</th>
                  <th>Código</th>
                  <th>Nombre del Curso</th>
                  @if (sigh.isCoordinador()) {
                    <th>Acción</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (dc of sigh.docenteCursos(); track dc.idCurso) {
                  <tr>
                    <td>#{{ dc.idCurso }}</td>
                    <td><strong>{{ dc.codigoCurso }}</strong></td>
                    <td>{{ dc.nombreCurso }}</td>
                    @if (sigh.isCoordinador()) {
                      <td>
                        <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.deshabilitarDocenteEnCurso(docenteSeleccionadoId()!, dc.idCurso)">
                          <span class="material-icons">delete</span> Retirar
                        </button>
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="sigh.isCoordinador() ? 4 : 3">Este docente aún no tiene cursos habilitados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- RF-03 y RF-04: ESPACIOS FÍSICOS Y DOTACIÓN DE RECURSOS (Dotación exclusiva de ADMINISTRADOR) -->
    @if (subTab() === 'espacios') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">domain</span> RF-03 & RF-04 | Espacios Físicos (Solo lectura RN-19) y Dotación (RN-14)</h3>
            <p class="md-card-subtitle">Aulas, laboratorios de cómputo y especializados. Selecciona un espacio para ver sus recursos.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Edificio</th>
                <th>Tipo</th>
                <th>Capacidad (RN-04)</th>
                <th>Dotación RF-04</th>
              </tr>
            </thead>
            <tbody>
              @for (e of sigh.espacios(); track e.idEspacio) {
                <tr>
                  <td>#{{ e.idEspacio }}</td>
                  <td><strong>{{ e.codigo }}</strong></td>
                  <td>{{ e.nombre }}</td>
                  <td>{{ e.edificio }}</td>
                  <td><span class="md-chip md-chip-info">{{ e.tipoEspacio }}</span></td>
                  <td><strong>{{ e.capacidad }}</strong> est.</td>
                  <td>
                    <button class="md-btn md-btn-tonal md-btn-sm" (click)="seleccionarEspacioDotacion(e.idEspacio)">
                      <span class="material-icons">inventory_2</span> {{ sigh.isAdmin() ? 'Ver / Dotar Recursos' : 'Ver Recursos' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (espacioSeleccionadoId()) {
        <div class="md-card">
          <div class="md-card-header">
            <h3 class="md-card-title">
              <span class="material-icons">build_circle</span>
              RF-04 | Recursos disponibles en Espacio #{{ espacioSeleccionadoId() }} (Regla RN-14)
            </h3>
          </div>
          @if (sigh.isAdmin()) {
            <div class="md-form-grid" style="margin-bottom: 16px">
              <div class="md-field">
                <label>Recurso</label>
                <select class="md-select" [(ngModel)]="recursoEspacioId">
                  <option [ngValue]="null" disabled>— Seleccione un recurso —</option>
                  @for (r of sigh.recursos(); track r.idRecurso) {
                    <option [ngValue]="r.idRecurso">{{ r.nombre }} ({{ r.categoria }})</option>
                  }
                </select>
              </div>
              <div class="md-field">
                <label>Cantidad</label>
                <input type="number" min="1" class="md-input" [(ngModel)]="recursoEspacioCantidad" />
              </div>
              <div>
                <button class="md-btn md-btn-filled" (click)="asignarRecursoEspacio()">
                  <span class="material-icons">add</span> Asignar / Actualizar Dotación
                </button>
              </div>
            </div>
          }
          <div class="md-table-container">
            <table class="md-table">
              <thead>
                <tr>
                  <th>ID Recurso</th>
                  <th>Recurso</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  @if (sigh.isAdmin()) {
                    <th>Acción</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (er of sigh.espacioRecursos(); track er.idRecurso) {
                  <tr>
                    <td>#{{ er.idRecurso }}</td>
                    <td><strong>{{ er.nombreRecurso }}</strong></td>
                    <td>{{ er.categoriaRecurso }}</td>
                    <td>{{ er.cantidad }}</td>
                    @if (sigh.isAdmin()) {
                      <td>
                        <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.eliminarRecursoDeEspacio(espacioSeleccionadoId()!, er.idRecurso)">
                          <span class="material-icons">delete</span> Quitar
                        </button>
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="sigh.isAdmin() ? 5 : 4">Este espacio no tiene recursos registrados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- RF-05: CURSOS Y RECURSOS REQUERIDOS (Escritura exclusiva de COORDINADOR) -->
    @if (subTab() === 'cursos') {
      @if (sigh.isCoordinador()) {
        <div class="md-card">
          <div class="md-card-header">
            <div>
              <h3 class="md-card-title"><span class="material-icons">library_add</span> RF-05 | Registrar / Actualizar Curso (RN-09)</h3>
              <p class="md-card-subtitle">Frecuencia semanal entre 1 y la frecuencia máxima del sistema (P-04: 4 sesiones de 2h).</p>
            </div>
          </div>
          <div class="md-form-grid">
            <div class="md-field">
              <label>Código del Curso</label>
              <input class="md-input" [(ngModel)]="nuevoCurso.codigo" placeholder="Ej. BD1-101" />
            </div>
            <div class="md-field">
              <label>Nombre del Curso</label>
              <input class="md-input" [(ngModel)]="nuevoCurso.nombre" placeholder="Ej. Bases de Datos 1" />
            </div>
            <div class="md-field">
              <label>Frecuencia Semanal (1 a 4)</label>
              <input type="number" min="1" max="4" class="md-input" [(ngModel)]="nuevoCurso.frecuenciaSemanal" />
            </div>
            <div>
              <button class="md-btn md-btn-filled" (click)="guardarCurso()">
                <span class="material-icons">save</span> Crear Curso
              </button>
            </div>
          </div>
        </div>
      }

      <div class="md-card">
        <div class="md-card-header">
          <h3 class="md-card-title"><span class="material-icons">menu_book</span> Catálogo de Cursos ({{ sigh.cursos().length }})</h3>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Frecuencia Semanal</th>
                <th>Horas Semanales</th>
                <th>Requisitos Técnicos (RN-14)</th>
              </tr>
            </thead>
            <tbody>
              @for (c of sigh.cursos(); track c.idCurso) {
                <tr>
                  <td>#{{ c.idCurso }}</td>
                  <td><strong>{{ c.codigo }}</strong></td>
                  <td>{{ c.nombre }}</td>
                  <td>{{ c.frecuenciaSemanal }} sesiones/sem</td>
                  <td>{{ c.horasSemanales || (c.frecuenciaSemanal * 2) }} h</td>
                  <td>
                    <button class="md-btn md-btn-tonal md-btn-sm" (click)="seleccionarCursoRequisitos(c.idCurso!)">
                      <span class="material-icons">handyman</span> Recursos Requeridos
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (cursoSeleccionadoId()) {
        <div class="md-card">
          <div class="md-card-header">
            <h3 class="md-card-title">
              <span class="material-icons">checklist</span>
              RF-05 | Recursos exigidos por el Curso #{{ cursoSeleccionadoId() }} (Regla RN-14)
            </h3>
          </div>
          @if (sigh.isCoordinador()) {
            <div class="md-form-grid" style="margin-bottom: 16px">
              <div class="md-field">
                <label>Recurso Exigido</label>
                <select class="md-select" [(ngModel)]="recursoCursoId">
                  <option [ngValue]="null" disabled>— Seleccione un recurso —</option>
                  @for (r of sigh.recursos(); track r.idRecurso) {
                    <option [ngValue]="r.idRecurso">{{ r.nombre }} ({{ r.categoria }})</option>
                  }
                </select>
              </div>
              <div>
                <button class="md-btn md-btn-filled" (click)="agregarRecursoCurso()">
                  <span class="material-icons">add</span> Exigir Recurso
                </button>
              </div>
            </div>
          }
          <div class="md-table-container">
            <table class="md-table">
              <thead>
                <tr>
                  <th>ID Recurso</th>
                  <th>Recurso</th>
                  <th>Categoría</th>
                  @if (sigh.isCoordinador()) {
                    <th>Acción</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (cr of sigh.cursoRecursos(); track cr.idRecurso) {
                  <tr>
                    <td>#{{ cr.idRecurso }}</td>
                    <td><strong>{{ cr.nombreRecurso }}</strong></td>
                    <td>{{ cr.categoriaRecurso }}</td>
                    @if (sigh.isCoordinador()) {
                      <td>
                        <button class="md-btn md-btn-danger md-btn-sm" (click)="sigh.eliminarRecursoDeCurso(cursoSeleccionadoId()!, cr.idRecurso)">
                          <span class="material-icons">delete</span> Quitar
                        </button>
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="sigh.isCoordinador() ? 4 : 3">Este curso no exige recursos específicos adicionales.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- RF-04: CATÁLOGO DE RECURSOS (Escritura exclusiva de ADMINISTRADOR) -->
    @if (subTab() === 'recursos') {
      @if (sigh.isAdmin()) {
        <div class="md-card">
          <div class="md-card-header">
            <h3 class="md-card-title"><span class="material-icons">add_moderator</span> RF-04 | Nuevo Recurso Técnico</h3>
          </div>
          <div class="md-form-grid">
            <div class="md-field">
              <label>Nombre del Recurso</label>
              <input class="md-input" [(ngModel)]="nuevoRecurso.nombre" placeholder="Ej. TABLERO INTELIGENTE" />
            </div>
            <div class="md-field">
              <label>Categoría</label>
              <select class="md-select" [(ngModel)]="nuevoRecurso.categoria">
                <option value="EQUIPO">EQUIPO</option>
                <option value="MOBILIARIO">MOBILIARIO</option>
                <option value="SOFTWARE">SOFTWARE</option>
              </select>
            </div>
            <div>
              <button class="md-btn md-btn-filled" (click)="guardarRecurso()">
                <span class="material-icons">add</span> Crear Recurso
              </button>
            </div>
          </div>
        </div>
      }

      <div class="md-card">
        <div class="md-card-header">
          <h3 class="md-card-title"><span class="material-icons">devices</span> Catálogo de Recursos ({{ sigh.recursos().length }})</h3>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Recurso</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              @for (r of sigh.recursos(); track r.idRecurso) {
                <tr>
                  <td>#{{ r.idRecurso }}</td>
                  <td><strong>{{ r.nombre }}</strong></td>
                  <td><span class="md-chip md-chip-info">{{ r.categoria }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-07: CATÁLOGO DE 33 FRANJAS HORARIAS -->
    @if (subTab() === 'franjas') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">schedule</span> RF-07 | Catálogo de 33 Franjas Horarias (RN-06, RN-07, RN-08)</h3>
            <p class="md-card-subtitle">6 franjas diarias Lunes–Viernes (07–09, 09–11, 13–15, 15–17, 17–19, 19–21) y 3 el Sábado (07–09, 09–11, 11–13). Zona muerta: 12:00–13:00.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>ID Franja</th>
                <th>Día Semana</th>
                <th>Nombre Día</th>
                <th>Hora Inicio</th>
                <th>Hora Fin (2h)</th>
              </tr>
            </thead>
            <tbody>
              @for (f of sigh.franjas(); track f.idFranja) {
                <tr>
                  <td><strong>#{{ f.idFranja }}</strong></td>
                  <td>{{ f.diaSemana }}</td>
                  <td>{{ f.nombreDia }}</td>
                  <td>{{ f.horaInicio }}</td>
                  <td>{{ f.horaFin }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- RF-08: PARÁMETROS DEL SISTEMA (Escritura exclusiva de ADMINISTRADOR) -->
    @if (subTab() === 'parametros') {
      <div class="md-card">
        <div class="md-card-header">
          <div>
            <h3 class="md-card-title"><span class="material-icons">tune</span> RF-08 | Parámetros Normativos del Sistema (P-01 a P-04 / RNF-07)</h3>
            <p class="md-card-subtitle">Los disparadores de la base de datos leen estos parámetros en tiempo real para validar cupos y frecuencias.</p>
          </div>
        </div>
        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>Clave</th>
                <th>Valor Actual</th>
                <th>Descripción</th>
                @if (sigh.isAdmin()) {
                  <th>Acción</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (param of sigh.parametros(); track param.clave) {
                <tr>
                  <td><code>{{ param.clave }}</code></td>
                  <td style="max-width: 140px">
                    @if (sigh.isAdmin()) {
                      <input type="number" class="md-input" [(ngModel)]="param.valor" />
                    } @else {
                      <span class="md-chip md-chip-info">{{ param.valor }}</span>
                    }
                  </td>
                  <td>{{ param.descripcion }}</td>
                  @if (sigh.isAdmin()) {
                    <td>
                      <button class="md-btn md-btn-filled md-btn-sm" (click)="sigh.actualizarParametro(param.clave, param.valor, param.descripcion)">
                        <span class="material-icons">save</span> Guardar
                      </button>
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
export class CatalogosModuleOrganismComponent implements OnInit {
  readonly sigh = inject(SighController);
  readonly subTab = signal<'periodos' | 'docentes' | 'espacios' | 'cursos' | 'recursos' | 'franjas' | 'parametros'>('periodos');

  nuevoPeriodo: PeriodoAcademico = {
    codigo: '2026-2',
    fechaInicio: '2026-07-20',
    fechaFin: '2026-11-30',
    estado: 'PLANEACION'
  };

  nuevoRecurso: Recurso = {
    nombre: '',
    categoria: 'EQUIPO'
  };

  nuevoCurso: Curso = {
    codigo: '',
    nombre: '',
    frecuenciaSemanal: 2
  };

  readonly docenteSeleccionadoId = signal<number | null>(null);
  cursoParaHabilitarId: number | null = null;

  readonly espacioSeleccionadoId = signal<number | null>(null);
  recursoEspacioId: number | null = null;
  recursoEspacioCantidad = 1;

  readonly cursoSeleccionadoId = signal<number | null>(null);
  recursoCursoId: number | null = null;

  ngOnInit(): void {
    if (this.sigh.isCoordinador()) {
      this.subTab.set('cursos');
    }
    const firstCourse = this.sigh.cursos()[0];
    if (firstCourse?.idCurso) this.cursoParaHabilitarId = firstCourse.idCurso;
    const firstRes = this.sigh.recursos()[0];
    if (firstRes?.idRecurso) {
      this.recursoEspacioId = firstRes.idRecurso;
      this.recursoCursoId = firstRes.idRecurso;
    }
  }

  guardarPeriodo(): void {
    if (!this.nuevoPeriodo.codigo) return;
    this.sigh.crearPeriodo({ ...this.nuevoPeriodo });
  }

  cambiarEstadoPeriodo(p: PeriodoAcademico, estado: string): void {
    if (!p.idPeriodo) return;
    this.sigh.actualizarPeriodo(p.idPeriodo, { ...p, estado });
  }

  seleccionarDocenteHabilitacion(idDocente: number): void {
    this.docenteSeleccionadoId.set(idDocente);
    this.sigh.cargarCursosPorDocente(idDocente);
  }

  habilitarCurso(): void {
    const idDoc = this.docenteSeleccionadoId();
    if (!idDoc || !this.cursoParaHabilitarId) return;
    this.sigh.habilitarDocenteEnCurso(idDoc, Number(this.cursoParaHabilitarId));
  }

  seleccionarEspacioDotacion(idEspacio: number): void {
    this.espacioSeleccionadoId.set(idEspacio);
    this.sigh.cargarRecursosDeEspacio(idEspacio);
  }

  asignarRecursoEspacio(): void {
    const idEsp = this.espacioSeleccionadoId();
    if (!idEsp || !this.recursoEspacioId) return;
    this.sigh.asignarRecursoAEspacio(idEsp, Number(this.recursoEspacioId), Number(this.recursoEspacioCantidad));
  }

  guardarCurso(): void {
    if (!this.nuevoCurso.codigo || !this.nuevoCurso.nombre) return;
    this.sigh.crearCurso({ ...this.nuevoCurso });
    this.nuevoCurso = { codigo: '', nombre: '', frecuenciaSemanal: 2 };
  }

  seleccionarCursoRequisitos(idCurso: number): void {
    this.cursoSeleccionadoId.set(idCurso);
    this.sigh.cargarRecursosDeCurso(idCurso);
  }

  agregarRecursoCurso(): void {
    const idCur = this.cursoSeleccionadoId();
    if (!idCur || !this.recursoCursoId) return;
    this.sigh.agregarRecursoACurso(idCur, Number(this.recursoCursoId));
  }

  guardarRecurso(): void {
    if (!this.nuevoRecurso.nombre) return;
    this.sigh.crearRecurso({ ...this.nuevoRecurso });
    this.nuevoRecurso = { nombre: '', categoria: 'EQUIPO' };
  }
}
