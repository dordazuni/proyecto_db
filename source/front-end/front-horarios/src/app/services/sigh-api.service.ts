import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  Asignacion,
  CargaDocente,
  Curso,
  CursoRecurso,
  Disponibilidad,
  Docente,
  DocenteCurso,
  Espacio,
  EspacioRecurso,
  Franja,
  HorarioDetalle,
  LogAuditoria,
  LoginRequest,
  LoginResponse,
  ParametroSistema,
  PeriodoAcademico,
  Recurso,
  Rol,
  Seccion,
  SeccionRiesgoCierre,
  SeccionSesionesFaltantes,
  SesionDiasConsecutivos,
  TipoContrato,
  Usuario,
  VersionHorario
} from '../models/sigh.models';

const SESSION_TOKEN_KEY = 'sigh_auth_token';
const SESSION_USER_KEY = 'sigh_auth_user';

@Injectable({
  providedIn: 'root'
})
export class SighApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = API_CONFIG.baseUrl;

  /** Token JWT y Usuario autenticado en sesión (RF-23, RF-25 y RNF-04) */
  readonly authToken = signal<string | null>(this.loadStoredToken());
  readonly authenticatedUser = signal<Usuario | null>(this.loadStoredUser());
  readonly isAuthenticated = computed(() => !!this.authToken() && this.authenticatedUser() !== null);

  /** ID del usuario autenticado actual (solo lectura desde la sesión del token) */
  readonly activeUserId = computed<number>(() => this.authenticatedUser()?.idUsuario ?? 0);

  private loadStoredToken(): string | null {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private loadStoredUser(): Usuario | null {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }

  setSession(token: string, usuario: Usuario): void {
    this.authToken.set(token);
    this.authenticatedUser.set(usuario);
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(usuario));
    } catch {
      // ignore storage errors
    }
  }

  updateTokenOnly(token: string): void {
    if (!token) return;
    this.authToken.set(token);
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch {
      // ignore storage errors
    }
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/refresh`, {}, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((res: LoginResponse) => {
          if (res?.token && res?.usuario) {
            this.setSession(res.token, res.usuario);
          }
        })
      );
  }

  setSessionUser(usuario: Usuario): void {
    this.authenticatedUser.set(usuario);
    try {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(usuario));
    } catch {
      // ignore storage errors
    }
  }

  logout(): void {
    const headers = this.getHeaders();
    this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers }).subscribe({
      next: () => {},
      error: () => {}
    });
    this.authToken.set(null);
    this.authenticatedUser.set(null);
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    } catch {
      // ignore storage errors
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((res: LoginResponse) => {
        if (res?.token && res?.usuario) {
          this.setSession(res.token, res.usuario);
        }
      })
    );
  }

  obtenerSesionActual(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/auth/me`, { headers: this.getHeaders() }).pipe(
      tap((usuario: Usuario) => {
        if (usuario) {
          this.setSessionUser(usuario);
        }
      })
    );
  }

  getHeaders(): HttpHeaders {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = this.authToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  // =========================================================================
  // 01. CATÁLOGOS (RF-01 a RF-08)
  // =========================================================================

  // RF-01: Períodos Académicos
  listarPeriodos(): Observable<PeriodoAcademico[]> {
    return this.http.get<PeriodoAcademico[]>(`${this.baseUrl}/periodos`, { headers: this.getHeaders() });
  }

  obtenerPeriodo(id: number): Observable<PeriodoAcademico> {
    return this.http.get<PeriodoAcademico>(`${this.baseUrl}/periodos/${id}`, { headers: this.getHeaders() });
  }

  crearPeriodo(periodo: PeriodoAcademico): Observable<PeriodoAcademico> {
    return this.http.post<PeriodoAcademico>(`${this.baseUrl}/periodos`, periodo, {
      headers: this.getHeaders()
    });
  }

  actualizarPeriodo(id: number, periodo: PeriodoAcademico): Observable<PeriodoAcademico> {
    return this.http.put<PeriodoAcademico>(`${this.baseUrl}/periodos/${id}`, periodo, {
      headers: this.getHeaders()
    });
  }

  // RF-02: Tipos de Contrato y Docentes (solo lectura RN-19)
  listarTiposContrato(): Observable<TipoContrato[]> {
    return this.http.get<TipoContrato[]>(`${this.baseUrl}/tipos-contrato`, { headers: this.getHeaders() });
  }

  listarDocentes(): Observable<Docente[]> {
    return this.http.get<Docente[]>(`${this.baseUrl}/docentes`, { headers: this.getHeaders() });
  }

  obtenerDocente(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.baseUrl}/docentes/${id}`, { headers: this.getHeaders() });
  }

  // RF-03: Espacios Físicos (solo lectura RN-19)
  listarEspacios(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.baseUrl}/espacios`, { headers: this.getHeaders() });
  }

  obtenerEspacio(id: number): Observable<Espacio> {
    return this.http.get<Espacio>(`${this.baseUrl}/espacios/${id}`, { headers: this.getHeaders() });
  }

  // RF-04: Catálogo de Recursos y Dotación por Espacio
  listarRecursos(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(`${this.baseUrl}/recursos`, { headers: this.getHeaders() });
  }

  crearRecurso(recurso: Recurso): Observable<Recurso> {
    return this.http.post<Recurso>(`${this.baseUrl}/recursos`, recurso, {
      headers: this.getHeaders()
    });
  }

  actualizarRecurso(id: number, recurso: Recurso): Observable<Recurso> {
    return this.http.put<Recurso>(`${this.baseUrl}/recursos/${id}`, recurso, {
      headers: this.getHeaders()
    });
  }

  listarRecursosDeEspacio(idEspacio: number): Observable<EspacioRecurso[]> {
    return this.http.get<EspacioRecurso[]>(`${this.baseUrl}/espacios/${idEspacio}/recursos`, {
      headers: this.getHeaders()
    });
  }

  asignarRecursoAEspacio(idEspacio: number, idRecurso: number, cantidad: number): Observable<EspacioRecurso> {
    return this.http.post<EspacioRecurso>(
      `${this.baseUrl}/espacios/${idEspacio}/recursos`,
      { idRecurso, cantidad },
      { headers: this.getHeaders() }
    );
  }

  actualizarRecursoDeEspacio(idEspacio: number, idRecurso: number, cantidad: number): Observable<EspacioRecurso> {
    return this.http.put<EspacioRecurso>(
      `${this.baseUrl}/espacios/${idEspacio}/recursos/${idRecurso}`,
      { cantidad },
      { headers: this.getHeaders() }
    );
  }

  eliminarRecursoDeEspacio(idEspacio: number, idRecurso: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/espacios/${idEspacio}/recursos/${idRecurso}`,
      { headers: this.getHeaders() }
    );
  }

  // RF-05: Cursos y Recursos Requeridos por Curso
  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.baseUrl}/cursos`, { headers: this.getHeaders() });
  }

  obtenerCurso(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.baseUrl}/cursos/${id}`, { headers: this.getHeaders() });
  }

  crearCurso(curso: Curso): Observable<Curso> {
    return this.http.post<Curso>(`${this.baseUrl}/cursos`, curso, {
      headers: this.getHeaders()
    });
  }

  actualizarCurso(id: number, curso: Curso): Observable<Curso> {
    return this.http.put<Curso>(`${this.baseUrl}/cursos/${id}`, curso, {
      headers: this.getHeaders()
    });
  }

  listarRecursosDeCurso(idCurso: number): Observable<CursoRecurso[]> {
    return this.http.get<CursoRecurso[]>(`${this.baseUrl}/cursos/${idCurso}/recursos`, {
      headers: this.getHeaders()
    });
  }

  agregarRecursoACurso(idCurso: number, idRecurso: number): Observable<CursoRecurso> {
    return this.http.post<CursoRecurso>(
      `${this.baseUrl}/cursos/${idCurso}/recursos`,
      { idRecurso },
      { headers: this.getHeaders() }
    );
  }

  eliminarRecursoDeCurso(idCurso: number, idRecurso: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/cursos/${idCurso}/recursos/${idRecurso}`,
      { headers: this.getHeaders() }
    );
  }

  // RF-06: Habilitación de Docentes por Curso
  listarCursosPorDocente(idDocente: number): Observable<DocenteCurso[]> {
    return this.http.get<DocenteCurso[]>(`${this.baseUrl}/docentes/${idDocente}/cursos`, {
      headers: this.getHeaders()
    });
  }

  listarDocentesPorCurso(idCurso: number): Observable<DocenteCurso[]> {
    return this.http.get<DocenteCurso[]>(`${this.baseUrl}/cursos/${idCurso}/docentes`, {
      headers: this.getHeaders()
    });
  }

  habilitarDocenteEnCurso(idDocente: number, idCurso: number): Observable<DocenteCurso> {
    return this.http.post<DocenteCurso>(
      `${this.baseUrl}/docentes/${idDocente}/cursos`,
      { idCurso },
      { headers: this.getHeaders() }
    );
  }

  deshabilitarDocenteEnCurso(idDocente: number, idCurso: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/docentes/${idDocente}/cursos/${idCurso}`,
      { headers: this.getHeaders() }
    );
  }

  // RF-07: Catálogo de 33 Franjas Horarias
  listarFranjas(): Observable<Franja[]> {
    return this.http.get<Franja[]>(`${this.baseUrl}/franjas`, { headers: this.getHeaders() });
  }

  actualizarFranja(id: number, franja: Partial<Franja>): Observable<Franja> {
    return this.http.put<Franja>(`${this.baseUrl}/franjas/${id}`, franja, {
      headers: this.getHeaders()
    });
  }

  // RF-08: Parámetros del Sistema
  listarParametros(): Observable<ParametroSistema[]> {
    return this.http.get<ParametroSistema[]>(`${this.baseUrl}/parametros`, { headers: this.getHeaders() });
  }

  actualizarParametro(clave: string, parametro: Partial<ParametroSistema>): Observable<ParametroSistema> {
    return this.http.put<ParametroSistema>(`${this.baseUrl}/parametros/${clave}`, parametro, {
      headers: this.getHeaders()
    });
  }

  // =========================================================================
  // 02. PLANEACIÓN (RF-09 a RF-11)
  // =========================================================================

  // RF-09 y RF-10: Secciones
  listarSecciones(idPeriodo?: number | null, idCurso?: number | null): Observable<Seccion[]> {
    let params = new HttpParams();
    if (idPeriodo) params = params.set('idPeriodo', idPeriodo);
    if (idCurso) params = params.set('idCurso', idCurso);
    return this.http.get<Seccion[]>(`${this.baseUrl}/secciones`, { params, headers: this.getHeaders() });
  }

  crearSeccion(seccion: Seccion): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.baseUrl}/secciones`, seccion, {
      headers: this.getHeaders()
    });
  }

  actualizarSeccion(id: number, seccion: Partial<Seccion>): Observable<Seccion> {
    return this.http.put<Seccion>(`${this.baseUrl}/secciones/${id}`, seccion, {
      headers: this.getHeaders()
    });
  }

  registrarMatriculaReal(idSeccion: number, matriculaReal: number): Observable<Seccion> {
    return this.http.patch<Seccion>(
      `${this.baseUrl}/secciones/${idSeccion}/matricula-real`,
      { matriculaReal },
      { headers: this.getHeaders() }
    );
  }

  cerrarSeccion(idSeccion: number): Observable<Seccion> {
    return this.http.patch<Seccion>(
      `${this.baseUrl}/secciones/${idSeccion}/cerrar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  cambiarEstadoSeccion(idSeccion: number, estado: 'ABIERTA' | 'CERRADA'): Observable<Seccion> {
    return this.http.patch<Seccion>(
      `${this.baseUrl}/secciones/${idSeccion}/estado`,
      { estado },
      { headers: this.getHeaders() }
    );
  }

  // RF-11: Disponibilidad Docente
  listarDisponibilidad(idDocente?: number | null, idPeriodo?: number | null): Observable<Disponibilidad[]> {
    let params = new HttpParams();
    if (idDocente) params = params.set('idDocente', idDocente);
    if (idPeriodo) params = params.set('idPeriodo', idPeriodo);
    return this.http.get<Disponibilidad[]>(`${this.baseUrl}/disponibilidad`, {
      params,
      headers: this.getHeaders()
    });
  }

  registrarDisponibilidad(disponibilidad: Disponibilidad): Observable<Disponibilidad> {
    return this.http.post<Disponibilidad>(
      `${this.baseUrl}/disponibilidad`,
      disponibilidad,
      { headers: this.getHeaders() }
    );
  }

  eliminarDisponibilidad(idDocente: number, idPeriodo: number, idFranja: number): Observable<{ message: string }> {
    const params = new HttpParams()
      .set('idDocente', idDocente)
      .set('idPeriodo', idPeriodo)
      .set('idFranja', idFranja);
    return this.http.delete<{ message: string }>(`${this.baseUrl}/disponibilidad`, {
      params,
      headers: this.getHeaders()
    });
  }

  // =========================================================================
  // 03. PROGRAMACIÓN DE HORARIOS (RF-12 a RF-17)
  // =========================================================================

  // RF-12: Versiones de Horario
  listarVersiones(idPeriodo?: number | null): Observable<VersionHorario[]> {
    let params = new HttpParams();
    if (idPeriodo) params = params.set('idPeriodo', idPeriodo);
    return this.http.get<VersionHorario[]>(`${this.baseUrl}/versiones`, {
      params,
      headers: this.getHeaders()
    });
  }

  crearVersion(idPeriodo: number): Observable<VersionHorario> {
    return this.http.post<VersionHorario>(
      `${this.baseUrl}/versiones`,
      { idPeriodo },
      { headers: this.getHeaders() }
    );
  }

  // RF-15: Enviar a aprobación (EN_EDICION -> PENDIENTE)
  enviarVersionAAprobacion(idVersion: number): Observable<VersionHorario> {
    return this.http.patch<VersionHorario>(
      `${this.baseUrl}/versiones/${idVersion}/enviar-aprobacion`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // RF-16: Avalar versión (PENDIENTE -> AVALADO)
  avalarVersion(idVersion: number): Observable<VersionHorario> {
    return this.http.patch<VersionHorario>(
      `${this.baseUrl}/versiones/${idVersion}/avalar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // RF-16: Devolver versión a edición (PENDIENTE -> EN_EDICION)
  devolverVersion(idVersion: number): Observable<VersionHorario> {
    return this.http.patch<VersionHorario>(
      `${this.baseUrl}/versiones/${idVersion}/devolver`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // RF-17: Sincronizar versión con repositorio documental externo (AVALADO -> SINCRONIZADO)
  sincronizarVersion(idVersion: number, idDocumentoExterno: string): Observable<VersionHorario> {
    return this.http.patch<VersionHorario>(
      `${this.baseUrl}/versiones/${idVersion}/sincronizar`,
      { idDocumentoExterno },
      { headers: this.getHeaders() }
    );
  }

  // RF-13 y RF-14: Asignaciones de Sesiones
  listarAsignaciones(idVersion?: number | null): Observable<Asignacion[]> {
    let params = new HttpParams();
    if (idVersion) params = params.set('idVersion', idVersion);
    return this.http.get<Asignacion[]>(`${this.baseUrl}/asignaciones`, {
      params,
      headers: this.getHeaders()
    });
  }

  crearAsignacion(asignacion: Asignacion): Observable<Asignacion> {
    return this.http.post<Asignacion>(
      `${this.baseUrl}/asignaciones`,
      asignacion,
      { headers: this.getHeaders() }
    );
  }

  actualizarAsignacion(idAsignacion: number, asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.http.put<Asignacion>(
      `${this.baseUrl}/asignaciones/${idAsignacion}`,
      asignacion,
      { headers: this.getHeaders() }
    );
  }

  eliminarAsignacion(idAsignacion: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/asignaciones/${idAsignacion}`, {
      headers: this.getHeaders()
    });
  }

  // =========================================================================
  // 04. CONSULTAS Y REPORTES (RF-19 a RF-22)
  // =========================================================================

  // RF-19: Consultar Horario
  consultarHorario(filtros: {
    idVersion?: number | null;
    idDocente?: number | null;
    idEspacio?: number | null;
    idSeccion?: number | null;
    idPeriodo?: number | null;
  }): Observable<HorarioDetalle[]> {
    let params = new HttpParams();
    if (filtros.idVersion) params = params.set('idVersion', filtros.idVersion);
    if (filtros.idDocente) params = params.set('idDocente', filtros.idDocente);
    if (filtros.idEspacio) params = params.set('idEspacio', filtros.idEspacio);
    if (filtros.idSeccion) params = params.set('idSeccion', filtros.idSeccion);
    if (filtros.idPeriodo) params = params.set('idPeriodo', filtros.idPeriodo);
    return this.http.get<HorarioDetalle[]>(`${this.baseUrl}/reportes/horario`, {
      params,
      headers: this.getHeaders()
    });
  }

  // RF-20: Carga Horaria Docente
  consultarCargaDocente(idVersion?: number | null, idDocente?: number | null, estadoCarga?: string | null): Observable<CargaDocente[]> {
    let params = new HttpParams();
    if (idVersion) params = params.set('idVersion', idVersion);
    if (idDocente) params = params.set('idDocente', idDocente);
    if (estadoCarga) params = params.set('estadoCarga', estadoCarga);
    return this.http.get<CargaDocente[]>(`${this.baseUrl}/reportes/carga-docente`, {
      params,
      headers: this.getHeaders()
    });
  }

  // RF-21: Secciones en Riesgo de Cierre
  consultarSeccionesRiesgoCierre(periodo?: string | null): Observable<SeccionRiesgoCierre[]> {
    let params = new HttpParams();
    if (periodo) params = params.set('periodo', periodo);
    return this.http.get<SeccionRiesgoCierre[]>(`${this.baseUrl}/reportes/secciones-riesgo-cierre`, {
      params,
      headers: this.getHeaders()
    });
  }

  // RF-22: Secciones con Sesiones Faltantes
  consultarSeccionesSesionesFaltantes(idVersion?: number | null): Observable<SeccionSesionesFaltantes[]> {
    let params = new HttpParams();
    if (idVersion) params = params.set('idVersion', idVersion);
    return this.http.get<SeccionSesionesFaltantes[]>(`${this.baseUrl}/reportes/secciones-sesiones-faltantes`, {
      params,
      headers: this.getHeaders()
    });
  }

  // RF-22: Sesiones en Días Consecutivos
  consultarSesionesDiasConsecutivos(idVersion?: number | null): Observable<SesionDiasConsecutivos[]> {
    let params = new HttpParams();
    if (idVersion) params = params.set('idVersion', idVersion);
    return this.http.get<SesionDiasConsecutivos[]>(`${this.baseUrl}/reportes/sesiones-dias-consecutivos`, {
      params,
      headers: this.getHeaders()
    });
  }

  // =========================================================================
  // 05. SEGURIDAD Y AUDITORÍA (RF-23 a RF-25)
  // =========================================================================

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}/roles`, { headers: this.getHeaders() });
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`, { headers: this.getHeaders() });
  }

  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios`, usuario, {
      headers: this.getHeaders()
    });
  }

  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/${id}`, usuario, {
      headers: this.getHeaders()
    });
  }

  listarAuditoria(filtros?: {
    tablaAfectada?: string | null;
    accion?: string | null;
    idUsuario?: number | null;
  }): Observable<LogAuditoria[]> {
    let params = new HttpParams();
    if (filtros?.tablaAfectada) params = params.set('tablaAfectada', filtros.tablaAfectada);
    if (filtros?.accion) params = params.set('accion', filtros.accion);
    if (filtros?.idUsuario) params = params.set('idUsuario', filtros.idUsuario);
    return this.http.get<LogAuditoria[]>(`${this.baseUrl}/auditoria`, {
      params,
      headers: this.getHeaders()
    });
  }
}
