import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Franja, HorarioDetalle } from '../../../models/sigh.models';

interface TimeRow {
  label: string;
  horaInicioPrefix: string;
  isDeadZone?: boolean;
}

@Component({
  selector: 'app-timetable-grid-organism',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timetable-wrapper">
      <table class="timetable-grid">
        <thead>
          <tr>
            <th class="time-col">Franja / Hora</th>
            @for (day of days; track day.dia) {
              <th>{{ day.nombre }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of timeRows; track row.label) {
            @if (row.isDeadZone) {
              <!-- La zona muerta es solo de lunes a viernes (5 columnas). La columna del
                   sábado la ocupa la celda de 11:00-13:00, que se extiende sobre esta fila. -->
              <tr class="dead-zone-row">
                <td class="time-col">{{ row.label }}</td>
                <td colspan="5" class="dead-zone-cell">
                  <span class="material-icons">block</span>
                  ZONA MUERTA (RN-06 / P-06): de lunes a viernes ninguna sesión puede tocar la franja de 12:00 a 13:00
                </td>
              </tr>
            } @else {
              <tr>
                <td class="time-col">{{ row.label }}</td>
                @for (day of days; track day.dia) {
                  @let franja = findFranja(day.dia, row.horaInicioPrefix);
                  <td
                    [attr.rowspan]="esSabadoOnce(day.dia, row) ? 2 : null"
                    class="slot-cell"
                    [class.disabled-slot]="!franja"
                    [class.editable-slot]="editable && !!franja"
                    (dragover)="onDragOver($event, franja)"
                    (drop)="onDrop($event, franja)"
                    (click)="onSlotClick(franja)">
                    @if (franja) {
                      <div class="slot-header">
                        <span class="franja-id">#F{{ franja.idFranja }}</span>
                      </div>
                      <div class="sessions-list">
                        @for (sesion of getSessionsForFranja(franja.idFranja); track sesion.idAsignacion) {
                          <div
                            class="session-card"
                            [draggable]="editable"
                            (dragstart)="onDragStart($event, sesion)"
                            (click)="$event.stopPropagation()">
                            <div class="session-top">
                              <span class="course-code">{{ sesion.codigoCurso }} (Sec. {{ sesion.numeroSeccion }})</span>
                              @if (editable) {
                                <button
                                  type="button"
                                  class="delete-session-btn"
                                  title="Eliminar sesión (RF-14)"
                                  (click)="deleteSession.emit(sesion.idAsignacion)">
                                  <span class="material-icons">delete_outline</span>
                                </button>
                              }
                            </div>
                            <div class="course-name">{{ sesion.nombreCurso }}</div>
                            <div class="session-meta">
                              <span><i class="material-icons">person</i> {{ sesion.docente }}</span>
                              <span><i class="material-icons">meeting_room</i> {{ sesion.codigoEspacio }} ({{ sesion.tipoEspacio }})</span>
                            </div>
                          </div>
                        }
                      </div>
                    } @else if (day.dia <= 5 && row.horaInicioPrefix === '11:00') {
                      <span class="closed-label">Sin franja: cruzaría 12:00-13:00 (RN-06)</span>
                    } @else {
                      <span class="closed-label">Fuera de ventana (RN-07)</span>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .timetable-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--md-outline-light);
      background: #ffffff;
    }
    .timetable-grid {
      width: 100%;
      border-collapse: collapse;
      min-width: 880px;
      table-layout: fixed;
    }
    .timetable-grid th {
      background: #1e293b;
      color: #ffffff;
      padding: 10px 8px;
      font-size: 0.82rem;
      font-weight: 500;
      text-align: center;
      border: 1px solid #334155;
    }
    .time-col {
      width: 115px;
      background: #f8fafc;
      font-weight: 600;
      font-size: 0.78rem;
      color: #334155;
      text-align: center;
      padding: 8px;
      border: 1px solid var(--md-outline-light);
    }
    .slot-cell {
      vertical-align: top;
      min-height: 78px;
      height: 82px;
      padding: 6px;
      border: 1px solid var(--md-outline-light);
      background: #ffffff;
      transition: background-color 0.15s ease;
    }
    .editable-slot:hover {
      background-color: #f0f7ff;
      cursor: pointer;
    }
    .disabled-slot {
      background-color: #f1f5f9;
      text-align: center;
      vertical-align: middle;
    }
    .closed-label {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .slot-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 4px;
    }
    .franja-id {
      font-size: 0.68rem;
      color: #94a3b8;
      font-family: 'Roboto Mono', monospace;
    }
    .dead-zone-row td {
      background: #fff1f2;
      color: #be123c;
      border: 1px solid #fecdd3;
      padding: 7px 12px;
      font-size: 0.78rem;
      font-weight: 500;
    }
    .dead-zone-cell {
      text-align: center;
    }
    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .session-card {
      background: #e8f0fe;
      border-left: 4px solid #1a73e8;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 0.75rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      cursor: grab;
    }
    .session-card:active {
      cursor: grabbing;
    }
    .session-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .course-code {
      font-weight: 700;
      color: #174ea6;
    }
    .course-name {
      color: #1e293b;
      font-weight: 500;
      margin: 2px 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .session-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: #475569;
      font-size: 0.7rem;
    }
    .session-meta .material-icons {
      font-size: 13px;
    }
    .delete-session-btn {
      background: transparent;
      border: none;
      color: #d93025;
      padding: 0;
      cursor: pointer;
      line-height: 1;
    }
    .delete-session-btn .material-icons {
      font-size: 16px;
    }
  `]
})
export class TimetableGridOrganismComponent {
  @Input() franjas: Franja[] = [];
  @Input() sesiones: HorarioDetalle[] = [];
  @Input() editable = false;

  @Output() selectSlot = new EventEmitter<Franja>();
  @Output() moveSession = new EventEmitter<{ sesion: HorarioDetalle; nuevaFranjaId: number }>();
  @Output() deleteSession = new EventEmitter<number>();

  private draggedSession: HorarioDetalle | null = null;

  readonly days = [
    { dia: 1, nombre: 'Lunes' },
    { dia: 2, nombre: 'Martes' },
    { dia: 3, nombre: 'Miércoles' },
    { dia: 4, nombre: 'Jueves' },
    { dia: 5, nombre: 'Viernes' },
    { dia: 6, nombre: 'Sábado' }
  ];

  readonly timeRows: TimeRow[] = [
    { label: '07:00 - 09:00', horaInicioPrefix: '07:00' },
    { label: '09:00 - 11:00', horaInicioPrefix: '09:00' },
    { label: '11:00 - 13:00', horaInicioPrefix: '11:00' },
    { label: '12:00 - 13:00', horaInicioPrefix: '12:00', isDeadZone: true },
    { label: '13:00 - 15:00', horaInicioPrefix: '13:00' },
    { label: '15:00 - 17:00', horaInicioPrefix: '15:00' },
    { label: '17:00 - 19:00', horaInicioPrefix: '17:00' },
    { label: '19:00 - 21:00', horaInicioPrefix: '19:00' }
  ];

  /** La celda del sábado 11:00-13:00 ocupa también la fila de la zona muerta (12:00-13:00). */
  esSabadoOnce(dia: number, row: TimeRow): boolean {
    return dia === 6 && row.horaInicioPrefix === '11:00';
  }

  findFranja(diaSemana: number, horaInicioPrefix: string): Franja | undefined {
    return this.franjas.find(
      (f) => f.diaSemana === diaSemana && String(f.horaInicio).startsWith(horaInicioPrefix)
    );
  }

  getSessionsForFranja(idFranja: number): HorarioDetalle[] {
    return this.sesiones.filter((s) => s.idFranja === idFranja);
  }

  onSlotClick(franja?: Franja): void {
    if (this.editable && franja) {
      this.selectSlot.emit(franja);
    }
  }

  onDragStart(event: DragEvent, sesion: HorarioDetalle): void {
    if (!this.editable) return;
    this.draggedSession = sesion;
    event.dataTransfer?.setData('text/plain', String(sesion.idAsignacion));
  }

  onDragOver(event: DragEvent, franja?: Franja): void {
    if (this.editable && franja) {
      event.preventDefault();
    }
  }

  onDrop(event: DragEvent, franja?: Franja): void {
    event.preventDefault();
    if (!this.editable || !franja || !this.draggedSession) return;
    if (this.draggedSession.idFranja !== franja.idFranja) {
      this.moveSession.emit({
        sesion: this.draggedSession,
        nuevaFranjaId: franja.idFranja
      });
    }
    this.draggedSession = null;
  }
}
