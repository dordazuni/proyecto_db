export interface PeriodoAcademico {
  idPeriodo?: number;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'PLANEACION' | 'ACTIVO' | 'CERRADO' | string;
}

export interface TipoContrato {
  idTipoContrato: number;
  nombre: string;
  horasMin: number;
  horasMax: number;
}

export interface Docente {
  idDocente: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  email: string;
  estadoVinculacion: string;
  idTipoContrato: number;
  nombreTipoContrato: string;
  horasMin: number;
  horasMax: number;
}

export interface Espacio {
  idEspacio: number;
  codigo: string;
  nombre: string;
  capacidad: number;
  edificio: string;
  tipoEspacio: string;
  numeroEquipos?: number;
  area?: string;
}

export interface Recurso {
  idRecurso?: number;
  nombre: string;
  categoria: 'EQUIPO' | 'MOBILIARIO' | 'SOFTWARE' | string;
}

export interface EspacioRecurso {
  idEspacio?: number;
  idRecurso: number;
  nombreRecurso?: string;
  categoriaRecurso?: string;
  cantidad: number;
}

export interface Curso {
  idCurso?: number;
  codigo: string;
  nombre: string;
  frecuenciaSemanal: number;
  horasSemanales?: number;
}

export interface CursoRecurso {
  idCurso?: number;
  idRecurso: number;
  nombreRecurso?: string;
  categoriaRecurso?: string;
}

export interface DocenteCurso {
  idDocente?: number;
  nombreDocente?: string;
  idCurso: number;
  codigoCurso?: string;
  nombreCurso?: string;
}

export interface Franja {
  idFranja: number;
  diaSemana: number;
  nombreDia: string;
  horaInicio: string;
  horaFin: string;
}

export interface ParametroSistema {
  clave: string;
  valor: number;
  descripcion: string;
}

export interface Seccion {
  idSeccion?: number;
  idCurso: number;
  codigoCurso?: string;
  nombreCurso?: string;
  idPeriodo: number;
  codigoPeriodo?: string;
  numero: number;
  cupoMax: number;
  cupoMin: number;
  matriculaProyectada: number;
  matriculaReal?: number | null;
  justificacionSobrecupo?: string | null;
  estado: 'ABIERTA' | 'CERRADA' | string;
}

export interface Disponibilidad {
  idDocente: number;
  nombreDocente?: string;
  idPeriodo: number;
  idFranja: number;
  diaSemana?: number;
  nombreDia?: string;
  horaInicio?: string;
  horaFin?: string;
  tipo: 'NO_DISPONIBLE' | 'DISPONIBLE' | string;
  idUsuario?: number;
}

export interface VersionHorario {
  idVersion?: number;
  idPeriodo: number;
  codigoPeriodo?: string;
  numeroVersion?: number;
  estado?: 'EN_EDICION' | 'PENDIENTE' | 'AVALADO' | 'SINCRONIZADO' | string;
  fechaAval?: string | null;
  idDocumentoExterno?: string | null;
  idUsuarioAval?: number | null;
  nombreUsuarioAval?: string | null;
  idUsuario?: number;
}

export interface Asignacion {
  idAsignacion?: number;
  idVersion: number;
  idSeccion: number;
  idDocente: number;
  idEspacio: number;
  idFranja: number;
  idUsuarioCreador?: number;
  fechaCreacion?: string;
  idUsuario?: number;
}

export interface HorarioDetalle {
  idAsignacion: number;
  idVersion: number;
  numeroVersion: number;
  estadoVersion: string;
  idPeriodo: number;
  periodo: string;
  idSeccion: number;
  codigoCurso: string;
  nombreCurso: string;
  numeroSeccion: number;
  idDocente: number;
  docente: string;
  idEspacio: number;
  codigoEspacio: string;
  tipoEspacio: string;
  idFranja: number;
  diaSemana: number;
  nombreDia: string;
  horaInicio: string;
  horaFin: string;
}

export interface CargaDocente {
  idVersion: number;
  idPeriodo: number;
  idDocente: number;
  docente: string;
  tipoContrato: string;
  sesiones: number;
  cargaAsignada: number;
  horasMin: number;
  horasMax: number;
  estadoCarga: string;
}

export interface SeccionRiesgoCierre {
  idSeccion: number;
  periodo: string;
  codigoCurso: string;
  nombreCurso: string;
  numeroSeccion: number;
  matriculaReal: number;
  cupoMin: number;
}

export interface SeccionSesionesFaltantes {
  idVersion: number;
  idSeccion: number;
  codigoCurso: string;
  numeroSeccion: number;
  frecuenciaSemanal: number;
  sesionesAsignadas: number;
  sesionesFaltantes: number;
}

export interface SesionDiasConsecutivos {
  idVersion: number;
  idSeccion: number;
  codigoCurso: string;
  numeroSeccion: number;
  dia1: string;
  dia2: string;
}

export interface Rol {
  idRol: number;
  nombre: string;
}

export interface Usuario {
  idUsuario?: number;
  nombreUsuario: string;
  contrasena?: string;
  activo: boolean;
  idRol: number;
  nombreRol?: string;
  idDocente?: number | null;
  nombreDocente?: string | null;
}

export interface LoginRequest {
  nombreUsuario: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface LogAuditoria {
  idLog: number;
  idUsuario: number;
  nombreUsuario: string;
  fechaHora: string;
  accion: string;
  tablaAfectada: string;
  detalle: string;
}

export interface ApiErrorResponse {
  status: number;
  regla: string;
  message: string;
  sqlState?: string;
  timestamp?: string;
}
