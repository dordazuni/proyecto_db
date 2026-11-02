import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { SighApiService } from '../services/sigh-api.service';
import { EchoService } from '../services/echo.service';
import {
  ApiErrorResponse,
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

export type SighModuleTab =
  | 'inicio'
  | 'catalogos'
  | 'planeacion'
  | 'programacion'
  | 'reportes'
  | 'seguridad';

const MODULOS_VALIDOS: SighModuleTab[] = ['inicio', 'catalogos', 'planeacion', 'programacion', 'reportes', 'seguridad'];
const UI_MODULO_KEY = 'sigh_ui_modulo';
const UI_PERIODO_KEY = 'sigh_ui_periodo';

export interface SighAlert {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  regla?: string;
  sqlState?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SighController {
  readonly api = inject(SighApiService);
  private readonly echoService = inject(EchoService);

  // Estado general de UI y Navegación MVC
  readonly activeModule = signal<SighModuleTab>('inicio');
  readonly loading = signal<boolean>(false);
  readonly alert = signal<SighAlert | null>(null);
  readonly echoData = this.echoService.lastEchoResponse;

  // 01. Catálogos (RF-01 a RF-08)
  readonly periodos = signal<PeriodoAcademico[]>([]);
  readonly selectedPeriodoId = signal<number | null>(null);
  readonly tiposContrato = signal<TipoContrato[]>([]);
  readonly docentes = signal<Docente[]>([]);
  readonly espacios = signal<Espacio[]>([]);
  readonly recursos = signal<Recurso[]>([]);
  readonly espacioRecursos = signal<EspacioRecurso[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly cursoRecursos = signal<CursoRecurso[]>([]);
  readonly docenteCursos = signal<DocenteCurso[]>([]);
  readonly franjas = signal<Franja[]>([]);
  readonly parametros = signal<ParametroSistema[]>([]);

  // 02. Planeación (RF-09 a RF-11)
  readonly secciones = signal<Seccion[]>([]);
  readonly disponibilidades = signal<Disponibilidad[]>([]);

  // 03. Programación (RF-12 a RF-17)
  readonly versiones = signal<VersionHorario[]>([]);
  readonly selectedVersionId = signal<number | null>(null);
  readonly asignaciones = signal<Asignacion[]>([]);
  readonly horarioGrilla = signal<HorarioDetalle[]>([]);

  // 04. Reportes (RF-19 a RF-22)
  readonly reporteHorario = signal<HorarioDetalle[]>([]);
  readonly reporteCargaDocente = signal<CargaDocente[]>([]);
  readonly reporteRiesgoCierre = signal<SeccionRiesgoCierre[]>([]);
  readonly reporteSesionesFaltantes = signal<SeccionSesionesFaltantes[]>([]);
  readonly reporteDiasConsecutivos = signal<SesionDiasConsecutivos[]>([]);
  /** Versión publicada que está viendo el docente (null = el período no tiene horario publicado). */
  readonly versionPublicadaDocente = signal<{ idVersion: number; numeroVersion: number; estado: string } | null>(null);

  // 05. Seguridad y Auditoría (RF-23 a RF-25)
  readonly roles = signal<Rol[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly auditoria = signal<LogAuditoria[]>([]);

  // Propiedades computadas de sesión y permisos por rol (RF-25 / RNF-04 / 05_roles_permisos.sql)
  readonly activeUser = computed(() => this.api.authenticatedUser());

  /** Rol del usuario en sesión. Sin sesión no hay rol (cadena vacía): ningún permiso queda activo por defecto. */
  readonly userRole = computed(() =>
    (this.api.authenticatedUser()?.nombreRol ?? '').toUpperCase()
  );

  readonly isAdmin = computed(() => this.userRole() === 'ADMINISTRADOR');
  readonly isCoordinador = computed(() => this.userRole() === 'COORDINADOR');
  readonly isAprobador = computed(() => this.userRole() === 'APROBADOR');
  readonly isDocente = computed(() => this.userRole() === 'DOCENTE');

  readonly canViewCatalogos = computed(() => this.isAdmin() || this.isCoordinador());
  readonly canViewPlaneacion = computed(() => this.isAdmin() || this.isCoordinador() || this.isDocente());
  readonly canViewProgramacion = computed(() => this.isAdmin() || this.isCoordinador() || this.isAprobador());
  readonly canViewReportes = computed(() => this.isAdmin() || this.isCoordinador() || this.isAprobador() || this.isDocente());
  readonly canViewSeguridad = computed(() => this.isAdmin());

  readonly selectedPeriodo = computed(() => {
    const pid = this.selectedPeriodoId();
    return this.periodos().find((p) => p.idPeriodo === pid) ?? null;
  });

  readonly selectedVersion = computed(() => {
    const vid = this.selectedVersionId();
    return this.versiones().find((v) => v.idVersion === vid) ?? null;
  });

  // =========================================================================
  // SESIÓN: limpieza de estado y vista conservada al recargar (F5)
  // =========================================================================

  /**
   * Deja el controlador como recién creado. Se llama al iniciar y al cerrar sesión,
   * para que ningún dato de un usuario (o rol) quede visible para el siguiente.
   */
  resetState(): void {
    this.activeModule.set('inicio');
    this.loading.set(false);
    this.alert.set(null);

    this.periodos.set([]);
    this.selectedPeriodoId.set(null);
    this.tiposContrato.set([]);
    this.docentes.set([]);
    this.espacios.set([]);
    this.recursos.set([]);
    this.espacioRecursos.set([]);
    this.cursos.set([]);
    this.cursoRecursos.set([]);
    this.docenteCursos.set([]);
    this.franjas.set([]);
    this.parametros.set([]);

    this.secciones.set([]);
    this.disponibilidades.set([]);

    this.versiones.set([]);
    this.selectedVersionId.set(null);
    this.asignaciones.set([]);
    this.horarioGrilla.set([]);

    this.reporteHorario.set([]);
    this.reporteCargaDocente.set([]);
    this.reporteRiesgoCierre.set([]);
    this.reporteSesionesFaltantes.set([]);
    this.reporteDiasConsecutivos.set([]);
    this.versionPublicadaDocente.set(null);

    this.roles.set([]);
    this.usuarios.set([]);
    this.auditoria.set([]);

    this.borrarVistaGuardada();
  }

  /** Cierra la sesión en el backend y en el navegador, y borra todo el estado en memoria. */
  cerrarSesion(): void {
    this.api.logout();
    this.resetState();
  }

  /** Indica si el rol en sesión puede abrir un módulo (mismas reglas del menú lateral). */
  puedeVerModulo(tab: SighModuleTab): boolean {
    switch (tab) {
      case 'inicio':
        return this.api.isAuthenticated();
      case 'catalogos':
        return this.canViewCatalogos();
      case 'planeacion':
        return this.canViewPlaneacion();
      case 'programacion':
        return this.canViewProgramacion();
      case 'reportes':
        return this.canViewReportes();
      case 'seguridad':
        return this.canViewSeguridad();
      default:
        return false;
    }
  }

  // La vista (módulo y período) se guarda en sessionStorage: sobrevive a F5 en la
  // misma pestaña, se borra al cerrar sesión y no se comparte con otras pestañas.
  private guardarVista(clave: string, valor: string): void {
    try {
      sessionStorage.setItem(clave, valor);
    } catch {
      // almacenamiento no disponible: la vista simplemente no se conserva
    }
  }

  private leerVista(clave: string): string | null {
    try {
      return sessionStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private borrarVistaGuardada(): void {
    try {
      sessionStorage.removeItem(UI_MODULO_KEY);
      sessionStorage.removeItem(UI_PERIODO_KEY);
    } catch {
      // ignorar
    }
  }

  private leerModuloGuardado(): SighModuleTab | null {
    const valor = this.leerVista(UI_MODULO_KEY) as SighModuleTab | null;
    return valor && MODULOS_VALIDOS.includes(valor) ? valor : null;
  }

  // Inicialización de datos maestros filtrada según permisos del rol activo en BD
  initializeDashboard(): void {
    this.loading.set(true);
    this.activeModule.set('inicio');
    this.echoService.checkEcho().subscribe({
      error: () => {}
    });

    this.cargarCatalogosBase();
    if (this.isAdmin()) {
      this.cargarSeguridadYAuditoria();
    }
  }

  setModule(tab: SighModuleTab): void {
    if (!this.puedeVerModulo(tab)) return;

    this.activeModule.set(tab);
    this.guardarVista(UI_MODULO_KEY, tab);
    this.clearAlert();
    if (tab === 'planeacion') {
      // La disponibilidad la carga el propio módulo de Planeación (docente y período visibles).
      if (!this.isDocente()) {
        this.cargarSecciones(this.selectedPeriodoId());
      }
    } else if (tab === 'programacion') {
      this.cargarVersiones(this.selectedPeriodoId());
    } else if (tab === 'reportes') {
      this.cargarTodosLosReportes();
    } else if (tab === 'seguridad' && this.isAdmin()) {
      this.cargarSeguridadYAuditoria();
    }
  }

  clearAlert(): void {
    this.alert.set(null);
  }

  showSuccess(title: string, message: string): void {
    this.alert.set({ type: 'success', title, message });
  }

  handleApiError(err: any, fallbackTitle = 'Operación rechazada por la Base de Datos'): void {
    this.loading.set(false);
    const apiErr: Partial<ApiErrorResponse> = err?.error && typeof err.error === 'object' ? err.error : {};
    const rawMsg = (
      apiErr.message ||
      (typeof err?.error === 'string' ? err.error : null) ||
      err?.message ||
      'Error al procesar la solicitud en el servidor.'
    ).replace(/^ERROR:\s*/i, '');
    const regla = apiErr.regla && apiErr.regla !== 'N/A' ? apiErr.regla : undefined;
    const sqlState = apiErr.sqlState || undefined;

    this.alert.set({
      type: 'error',
      title: regla ? `${fallbackTitle} [${regla}]` : fallbackTitle,
      message: rawMsg,
      regla,
      sqlState
    });
  }

  // =========================================================================
  // 01. CATÁLOGOS (RF-01 a RF-08)
  // =========================================================================

  cargarCatalogosBase(): void {
    const puedeVerCatalogos = this.isAdmin() || this.isCoordinador();
    // Cada lista falla por separado (lista vacía) sin tumbar las demás.
    const lista = <T>(obs: Observable<T[]>): Observable<T[]> => obs.pipe(catchError(() => of([] as T[])));
    const vacia = <T>(): Observable<T[]> => of([] as T[]);

    // Se espera a que lleguen TODOS los catálogos antes de restaurar la vista y elegir
    // el período: así, tras F5, el módulo restaurado ya encuentra sus listas cargadas.
    forkJoin({
      periodos: this.api.listarPeriodos(),
      cursos: lista(this.api.listarCursos()),
      franjas: lista(this.api.listarFranjas()),
      tiposContrato: puedeVerCatalogos ? lista(this.api.listarTiposContrato()) : vacia<TipoContrato>(),
      docentes: puedeVerCatalogos ? lista(this.api.listarDocentes()) : vacia<Docente>(),
      espacios: puedeVerCatalogos ? lista(this.api.listarEspacios()) : vacia<Espacio>(),
      recursos: puedeVerCatalogos ? lista(this.api.listarRecursos()) : vacia<Recurso>(),
      parametros: puedeVerCatalogos ? lista(this.api.listarParametros()) : vacia<ParametroSistema>()
    }).subscribe({
      next: (d) => {
        this.periodos.set(d.periodos);
        this.cursos.set(d.cursos);
        this.franjas.set(d.franjas);
        this.tiposContrato.set(d.tiposContrato);
        this.docentes.set(d.docentes);
        this.espacios.set(d.espacios);
        this.recursos.set(d.recursos);
        this.parametros.set(d.parametros);

        // F5: se restaura el módulo ANTES de seleccionar el período, para que la carga
        // del período (secciones, versiones, reportes) alimente el módulo restaurado.
        const moduloGuardado = this.leerModuloGuardado();
        if (moduloGuardado && this.puedeVerModulo(moduloGuardado)) {
          this.activeModule.set(moduloGuardado);
        }

        const list = d.periodos;
        if (!this.selectedPeriodoId() && list.length > 0) {
          const idGuardado = Number(this.leerVista(UI_PERIODO_KEY));
          const guardado = list.find((p) => p.idPeriodo === idGuardado);
          const activo = guardado ?? list.find((p) => p.estado === 'ACTIVO' || p.estado === 'PLANEACION') ?? list[0];
          this.seleccionarPeriodo(activo.idPeriodo!);
        }
        this.loading.set(false);
      },
      error: (err) => this.handleApiError(err, 'Error al cargar períodos')
    });
  }

  seleccionarPeriodo(idPeriodo: number): void {
    this.selectedPeriodoId.set(Number(idPeriodo));
    this.guardarVista(UI_PERIODO_KEY, String(idPeriodo));
    if (this.isAdmin() || this.isCoordinador()) {
      this.cargarSecciones(Number(idPeriodo));
    }
    if (this.isAdmin() || this.isCoordinador() || this.isAprobador()) {
      this.cargarVersiones(Number(idPeriodo));
    } else if (this.isDocente()) {
      this.cargarHorarioDocente(Number(idPeriodo));
    }
  }

  crearPeriodo(periodo: PeriodoAcademico): void {
    this.api.crearPeriodo(periodo).subscribe({
      next: (creado) => {
        this.showSuccess('RF-01 | Período creado', `Período ${creado.codigo} (${creado.estado}) registrado.`);
        this.api.listarPeriodos().subscribe((l) => this.periodos.set(l));
      },
      error: (err) => this.handleApiError(err, 'No se pudo crear el período (RF-01)')
    });
  }

  actualizarPeriodo(id: number, periodo: PeriodoAcademico): void {
    this.api.actualizarPeriodo(id, periodo).subscribe({
      next: (act) => {
        this.showSuccess('RF-01 | Período actualizado', `Período ${act.codigo} actualizado a estado ${act.estado}.`);
        this.api.listarPeriodos().subscribe((l) => this.periodos.set(l));
      },
      error: (err) => this.handleApiError(err, 'No se pudo actualizar el período (RF-01)')
    });
  }

  crearRecurso(recurso: Recurso): void {
    this.api.crearRecurso(recurso).subscribe({
      next: (r) => {
        this.showSuccess('RF-04 | Recurso creado', `Recurso "${r.nombre}" (${r.categoria}) agregado al catálogo.`);
        this.api.listarRecursos().subscribe((l) => this.recursos.set(l));
      },
      error: (err) => this.handleApiError(err, 'No se pudo crear el recurso (RF-04)')
    });
  }

  cargarRecursosDeEspacio(idEspacio: number): void {
    this.api.listarRecursosDeEspacio(idEspacio).subscribe({
      next: (l) => this.espacioRecursos.set(l),
      error: (err) => this.handleApiError(err, 'Error al consultar recursos del espacio')
    });
  }

  asignarRecursoAEspacio(idEspacio: number, idRecurso: number, cantidad: number): void {
    this.api.asignarRecursoAEspacio(idEspacio, idRecurso, cantidad).subscribe({
      next: () => {
        this.showSuccess('RF-04 | Dotación registrada', 'Recurso asignado al espacio físico.');
        this.cargarRecursosDeEspacio(idEspacio);
      },
      error: (err) => this.handleApiError(err, 'Error al asignar recurso al espacio (RF-04)')
    });
  }

  eliminarRecursoDeEspacio(idEspacio: number, idRecurso: number): void {
    this.api.eliminarRecursoDeEspacio(idEspacio, idRecurso).subscribe({
      next: () => {
        this.showSuccess('RF-04 | Recurso retirado', 'Se retiró el recurso del espacio.');
        this.cargarRecursosDeEspacio(idEspacio);
      },
      error: (err) => this.handleApiError(err, 'Error al retirar recurso del espacio')
    });
  }

  crearCurso(curso: Curso): void {
    this.api.crearCurso(curso).subscribe({
      next: (c) => {
        this.showSuccess('RF-05 | Curso creado', `Curso ${c.codigo} - ${c.nombre} registrado.`);
        this.api.listarCursos().subscribe((l) => this.cursos.set(l));
      },
      error: (err) => this.handleApiError(err, 'Error al crear curso (RF-05 / RN-09)')
    });
  }

  actualizarCurso(id: number, curso: Curso): void {
    this.api.actualizarCurso(id, curso).subscribe({
      next: (c) => {
        this.showSuccess('RF-05 | Curso actualizado', `Curso ${c.codigo} actualizado.`);
        this.api.listarCursos().subscribe((l) => this.cursos.set(l));
      },
      error: (err) => this.handleApiError(err, 'Error al actualizar curso (RF-05 / RN-09)')
    });
  }

  cargarRecursosDeCurso(idCurso: number): void {
    this.api.listarRecursosDeCurso(idCurso).subscribe({
      next: (l) => this.cursoRecursos.set(l),
      error: (err) => this.handleApiError(err, 'Error al cargar recursos requeridos del curso')
    });
  }

  agregarRecursoACurso(idCurso: number, idRecurso: number): void {
    this.api.agregarRecursoACurso(idCurso, idRecurso).subscribe({
      next: () => {
        this.showSuccess('RF-05 | Requisito técnico agregado', 'Recurso requerido vinculado al curso (RN-14).');
        this.cargarRecursosDeCurso(idCurso);
      },
      error: (err) => this.handleApiError(err, 'Error al agregar recurso al curso (RF-05)')
    });
  }

  eliminarRecursoDeCurso(idCurso: number, idRecurso: number): void {
    this.api.eliminarRecursoDeCurso(idCurso, idRecurso).subscribe({
      next: () => {
        this.showSuccess('RF-05 | Requisito técnico eliminado', 'Se retiró el recurso requerido del curso.');
        this.cargarRecursosDeCurso(idCurso);
      },
      error: (err) => this.handleApiError(err, 'Error al quitar recurso del curso')
    });
  }

  cargarCursosPorDocente(idDocente: number): void {
    this.api.listarCursosPorDocente(idDocente).subscribe({
      next: (l) => this.docenteCursos.set(l),
      error: (err) => this.handleApiError(err, 'Error al consultar cursos habilitados del docente')
    });
  }

  habilitarDocenteEnCurso(idDocente: number, idCurso: number): void {
    this.api.habilitarDocenteEnCurso(idDocente, idCurso).subscribe({
      next: () => {
        this.showSuccess('RF-06 | Docente habilitado', 'Se registró la habilitación del docente para dictar el curso (RN-12).');
        this.cargarCursosPorDocente(idDocente);
      },
      error: (err) => this.handleApiError(err, 'No se pudo habilitar al docente en el curso (RF-06)')
    });
  }

  deshabilitarDocenteEnCurso(idDocente: number, idCurso: number): void {
    this.api.deshabilitarDocenteEnCurso(idDocente, idCurso).subscribe({
      next: () => {
        this.showSuccess('RF-06 | Habilitación retirada', 'Se retiró la habilitación del curso para el docente.');
        this.cargarCursosPorDocente(idDocente);
      },
      error: (err) => this.handleApiError(err, 'No se pudo retirar la habilitación')
    });
  }

  actualizarParametro(clave: string, valor: number, descripcion: string): void {
    this.api.actualizarParametro(clave, { clave, valor, descripcion }).subscribe({
      next: (p) => {
        this.showSuccess('RF-08 | Parámetro actualizado', `Parámetro ${p.clave} actualizado a ${p.valor} (RNF-07).`);
        this.api.listarParametros().subscribe((l) => this.parametros.set(l));
      },
      error: (err) => this.handleApiError(err, 'Error al actualizar parámetro del sistema (RF-08)')
    });
  }

  // =========================================================================
  // 02. PLANEACIÓN (RF-09 a RF-11)
  // =========================================================================

  cargarSecciones(idPeriodo?: number | null, idCurso?: number | null): void {
    if (!this.isAdmin() && !this.isCoordinador()) return;
    this.api.listarSecciones(idPeriodo, idCurso).subscribe({
      next: (l) => this.secciones.set(l),
      error: (err) => this.handleApiError(err, 'Error al listar secciones')
    });
  }

  crearSeccion(seccion: Seccion): void {
    this.api.crearSeccion(seccion).subscribe({
      next: (s) => {
        this.showSuccess(
          'RF-09 | Sección abierta',
          `Sección #${s.numero} creada con cupo máx ${s.cupoMax} y proyectada ${s.matriculaProyectada}.`
        );
        this.cargarSecciones(this.selectedPeriodoId());
      },
      error: (err) => this.handleApiError(err, 'Rechazo al abrir sección (RF-09 / RN-10)')
    });
  }

  registrarMatriculaReal(idSeccion: number, matriculaReal: number): void {
    this.api.registrarMatriculaReal(idSeccion, matriculaReal).subscribe({
      next: (s) => {
        this.showSuccess(
          'RF-10 | Matrícula real registrada',
          `Sección #${s.numero} (${s.codigoCurso || ''}) actualizada con matrícula real = ${s.matriculaReal}.`
        );
        this.cargarSecciones(this.selectedPeriodoId());
        this.cargarTodosLosReportes();
      },
      error: (err) => this.handleApiError(err, 'Error al registrar matrícula real (RF-10)')
    });
  }

  cerrarSeccion(idSeccion: number): void {
    this.api.cerrarSeccion(idSeccion).subscribe({
      next: (s) => {
        this.showSuccess('RF-10 | Sección cerrada', `La sección #${s.numero} ha pasado a estado CERRADA (RN-11).`);
        this.cargarSecciones(this.selectedPeriodoId());
        this.cargarTodosLosReportes();
      },
      error: (err) => this.handleApiError(err, 'No se pudo cerrar la sección (RF-10)')
    });
  }

  cargarDisponibilidad(idDocente: number, idPeriodo: number): void {
    if (!this.isCoordinador() && !this.isDocente()) return;
    // Se vacía antes de pedir, para no mostrar ni un instante la del docente o período anterior.
    this.disponibilidades.set([]);
    this.api.listarDisponibilidad(idDocente, idPeriodo).subscribe({
      next: (l) => this.disponibilidades.set(l),
      error: (err) => this.handleApiError(err, 'Error al consultar disponibilidad del docente (RF-11)')
    });
  }

  toggleDisponibilidadFranja(idDocente: number, idPeriodo: number, idFranja: number): void {
    if (!this.isDocente()) return;
    const existente = this.disponibilidades().find(
      (d) => d.idDocente === idDocente && d.idPeriodo === idPeriodo && d.idFranja === idFranja && d.tipo === 'NO_DISPONIBLE'
    );

    if (existente) {
      this.api.eliminarDisponibilidad(idDocente, idPeriodo, idFranja).subscribe({
        next: () => {
          this.showSuccess('RF-11 | Franja disponible', 'Se eliminó la restricción; la franja vuelve a estar DISPONIBLE (S-04).');
          this.cargarDisponibilidad(idDocente, idPeriodo);
        },
        error: (err) => this.handleApiError(err, 'Error al actualizar disponibilidad (RF-11 / RN-19)')
      });
    } else {
      this.api
        .registrarDisponibilidad({
          idDocente,
          idPeriodo,
          idFranja,
          tipo: 'NO_DISPONIBLE'
        })
        .subscribe({
          next: () => {
            this.showSuccess('RF-11 | Franja NO DISPONIBLE', 'Se registró la restricción horaria del docente (RN-13).');
            this.cargarDisponibilidad(idDocente, idPeriodo);
          },
          error: (err) => this.handleApiError(err, 'Error al registrar disponibilidad (RF-11 / RN-19)')
        });
    }
  }

  // =========================================================================
  // 03. PROGRAMACIÓN DE HORARIOS (RF-12 a RF-17)
  // =========================================================================

  cargarVersiones(idPeriodo?: number | null): void {
    if (this.isDocente()) return;
    this.api.listarVersiones(idPeriodo).subscribe({
      next: (list) => {
        this.versiones.set(list);
        if (list.length > 0) {
          const current = list.find((v) => v.idVersion === this.selectedVersionId());
          const target = current ?? list.find((v) => v.estado === 'EN_EDICION') ?? list[0];
          this.seleccionarVersion(target.idVersion!);
        } else {
          this.selectedVersionId.set(null);
          this.asignaciones.set([]);
          this.horarioGrilla.set([]);
        }
        // Si el usuario está en Reportes (por ejemplo, tras F5 o al cambiar de período),
        // los reportes se recargan con la versión recién seleccionada.
        if (this.activeModule() === 'reportes') {
          this.cargarTodosLosReportes();
        }
      },
      error: (err) => this.handleApiError(err, 'Error al cargar versiones de horario (RF-12)')
    });
  }

  seleccionarVersion(idVersion: number): void {
    this.selectedVersionId.set(Number(idVersion));
    this.cargarAsignacionesYGrilla(Number(idVersion));
  }

  cargarAsignacionesYGrilla(idVersion: number): void {
    if (this.isAdmin() || this.isCoordinador()) {
      this.api.listarAsignaciones(idVersion).subscribe({
        next: (a) => this.asignaciones.set(a),
        error: () => {}
      });
    }
    this.api.consultarHorario({ idVersion }).subscribe({
      next: (h) => this.horarioGrilla.set(h),
      error: () => {}
    });
  }

  crearVersion(idPeriodo: number): void {
    this.api.crearVersion(idPeriodo).subscribe({
      next: (v) => {
        this.showSuccess('RF-12 | Nueva versión creada', `Versión v${v.numeroVersion} creada en estado ${v.estado}.`);
        this.cargarVersiones(idPeriodo);
        this.seleccionarVersion(v.idVersion!);
      },
      error: (err) => this.handleApiError(err, 'No se pudo crear la versión de horario (RF-12)')
    });
  }

  enviarAAprobacion(idVersion: number): void {
    this.api.enviarVersionAAprobacion(idVersion).subscribe({
      next: (v) => {
        this.showSuccess('RF-15 | Enviada a aprobación', `La versión v${v.numeroVersion} pasó a estado ${v.estado} (RN-17).`);
        this.cargarVersiones(this.selectedPeriodoId());
      },
      error: (err) => this.handleApiError(err, 'No se pudo enviar la versión a aprobación (RF-15 / RN-17)')
    });
  }

  avalarVersion(idVersion: number): void {
    this.api.avalarVersion(idVersion).subscribe({
      next: (v) => {
        this.showSuccess('RF-16 | Versión AVALADA', `La versión v${v.numeroVersion} fue avalada exitosamente (RN-16, RN-17).`);
        this.cargarVersiones(this.selectedPeriodoId());
      },
      error: (err) => this.handleApiError(err, 'Rechazo al avalar versión — Exige rol APROBADOR (RF-16 / RN-17)')
    });
  }

  devolverVersion(idVersion: number): void {
    this.api.devolverVersion(idVersion).subscribe({
      next: (v) => {
        this.showSuccess('RF-16 | Versión devuelta a edición', `La versión v${v.numeroVersion} regresó a estado ${v.estado}.`);
        this.cargarVersiones(this.selectedPeriodoId());
      },
      error: (err) => this.handleApiError(err, 'Rechazo al devolver versión (RF-16 / RN-17)')
    });
  }

  sincronizarVersion(idVersion: number, idDocumentoExterno: string): void {
    this.api.sincronizarVersion(idVersion, idDocumentoExterno).subscribe({
      next: (v) => {
        this.showSuccess(
          'RF-17 | Versión SINCRONIZADA',
          `Sincronizada con repositorio documental externo (${v.idDocumentoExterno}).`
        );
        this.cargarVersiones(this.selectedPeriodoId());
      },
      error: (err) => this.handleApiError(err, 'Rechazo al sincronizar versión (RF-17 / RN-17)')
    });
  }

  crearAsignacion(asignacion: Asignacion): void {
    this.api.crearAsignacion(asignacion).subscribe({
      next: () => {
        this.showSuccess(
          'RF-13 | Sesión asignada en Base de Datos',
          'La sesión superó todas las reglas duras (RN-01 a RN-16) y quedó registrada en la bitácora (RF-24).'
        );
        this.cargarAsignacionesYGrilla(asignacion.idVersion);
        this.cargarTodosLosReportes();
      },
      error: (err) => this.handleApiError(err, 'Asignación rechazada por regla de dominio en la Base de Datos')
    });
  }

  moverAsignacion(idAsignacion: number, cambios: Partial<Asignacion>): void {
    const vid = this.selectedVersionId();
    this.api.actualizarAsignacion(idAsignacion, cambios).subscribe({
      next: () => {
        this.showSuccess(
          'RF-14 | Sesión actualizada',
          'El cambio de franja/espacio/docente cumplió las reglas del dominio (RN-01 a RN-16).'
        );
        if (vid) this.cargarAsignacionesYGrilla(vid);
        this.cargarTodosLosReportes();
      },
      error: (err) => this.handleApiError(err, 'Modificación rechazada por regla en Base de Datos (RF-14)')
    });
  }

  eliminarAsignacion(idAsignacion: number): void {
    const vid = this.selectedVersionId();
    this.api.eliminarAsignacion(idAsignacion).subscribe({
      next: () => {
        this.showSuccess('RF-14 | Sesión eliminada', 'La asignación fue eliminada de la versión activa.');
        if (vid) this.cargarAsignacionesYGrilla(vid);
        this.cargarTodosLosReportes();
      },
      error: (err) => this.handleApiError(err, 'No se pudo eliminar la asignación (RF-14 / RN-16)')
    });
  }

  // =========================================================================
  // 04. CONSULTAS Y REPORTES (RF-19 a RF-22)
  // =========================================================================

  cargarTodosLosReportes(): void {
    const idVersion = this.selectedVersionId();
    const codigoPeriodo = this.selectedPeriodo()?.codigo;

    if (this.isDocente()) {
      const pid = this.selectedPeriodoId();
      if (pid) this.cargarHorarioDocente(pid);
      return;
    }

    // Sin versión seleccionada no hay nada que reportar: si se consultara con idVersion
    // nulo, el backend devolvería las filas de TODAS las versiones mezcladas.
    if (!idVersion) {
      this.reporteHorario.set([]);
      this.reporteCargaDocente.set([]);
      this.reporteSesionesFaltantes.set([]);
      this.reporteDiasConsecutivos.set([]);
      if (this.isAdmin() || this.isCoordinador()) {
        this.api.consultarSeccionesRiesgoCierre(codigoPeriodo).subscribe({
          next: (d) => this.reporteRiesgoCierre.set(d),
          error: () => {}
        });
      }
      return;
    }

    this.consultarHorarioReporte({ idVersion });
    this.api.consultarCargaDocente(idVersion).subscribe({
      next: (d) => this.reporteCargaDocente.set(d),
      error: () => {}
    });
    if (this.isAdmin() || this.isCoordinador()) {
      this.api.consultarSeccionesRiesgoCierre(codigoPeriodo).subscribe({
        next: (d) => this.reporteRiesgoCierre.set(d),
        error: () => {}
      });
    }
    this.api.consultarSeccionesSesionesFaltantes(idVersion).subscribe({
      next: (d) => this.reporteSesionesFaltantes.set(d),
      error: () => {}
    });
    this.api.consultarSesionesDiasConsecutivos(idVersion).subscribe({
      next: (d) => this.reporteDiasConsecutivos.set(d),
      error: () => {}
    });
  }

  /**
   * Horario del docente en sesión para un período: se muestra SOLO la última versión
   * AVALADA o SINCRONIZADA (la publicada). Si el período no tiene ninguna, la lista
   * queda vacía y versionPublicadaDocente queda en null (la vista muestra un aviso).
   * El rol docente no puede leer version_horario; por eso la versión se deduce de
   * v_horario, que sí trae id, número y estado de la versión en cada fila.
   */
  cargarHorarioDocente(idPeriodo: number): void {
    const idDoc = this.api.authenticatedUser()?.idDocente ?? null;
    this.reporteHorario.set([]);
    this.versionPublicadaDocente.set(null);
    if (!idDoc) return;

    this.api.consultarHorario({ idPeriodo }).subscribe({
      next: (filas) => {
        if (this.selectedPeriodoId() !== idPeriodo) return; // llegó tarde: el usuario ya cambió de período
        const publicadas = filas.filter((f) => f.estadoVersion === 'AVALADO' || f.estadoVersion === 'SINCRONIZADO');
        if (publicadas.length === 0) return;
        const ultima = publicadas.reduce((a, b) => (b.numeroVersion > a.numeroVersion ? b : a));
        this.versionPublicadaDocente.set({
          idVersion: ultima.idVersion,
          numeroVersion: ultima.numeroVersion,
          estado: ultima.estadoVersion
        });
        this.reporteHorario.set(publicadas.filter((f) => f.idVersion === ultima.idVersion && f.idDocente === idDoc));
      },
      error: (err) => this.handleApiError(err, 'Error al consultar tu horario (RF-19)')
    });
  }

  consultarHorarioReporte(filtros: {
    idVersion?: number | null;
    idDocente?: number | null;
    idEspacio?: number | null;
    idSeccion?: number | null;
    idPeriodo?: number | null;
  }): void {
    this.api.consultarHorario(filtros).subscribe({
      next: (d) => this.reporteHorario.set(d),
      error: (err) => this.handleApiError(err, 'Error al consultar horario (RF-19)')
    });
  }

  filtrarCargaDocente(idVersion?: number | null, idDocente?: number | null, estadoCarga?: string | null): void {
    if (!idVersion) {
      this.reporteCargaDocente.set([]);
      return;
    }
    this.api.consultarCargaDocente(idVersion, idDocente, estadoCarga).subscribe({
      next: (d) => this.reporteCargaDocente.set(d),
      error: (err) => this.handleApiError(err, 'Error al consultar carga docente (RF-20)')
    });
  }

  // =========================================================================
  // 05. SEGURIDAD Y AUDITORÍA (RF-23 a RF-25)
  // =========================================================================

  cargarSeguridadYAuditoria(): void {
    if (!this.isAdmin()) return;
    this.api.listarRoles().subscribe({ next: (r) => this.roles.set(r), error: () => {} });
    this.api.listarUsuarios().subscribe({ next: (u) => this.usuarios.set(u), error: () => {} });
    this.filtrarAuditoria({});
  }

  crearUsuario(usuario: Usuario): void {
    this.api.crearUsuario(usuario).subscribe({
      next: (u) => {
        this.showSuccess('RF-23 | Usuario registrado', `Usuario "${u.nombreUsuario}" creado exitosamente.`);
        this.api.listarUsuarios().subscribe((l) => this.usuarios.set(l));
      },
      error: (err) => this.handleApiError(err, 'Error al crear usuario (RF-23 / S-09)')
    });
  }

  actualizarUsuario(idUsuario: number, cambios: Partial<Usuario>): void {
    this.api.actualizarUsuario(idUsuario, cambios).subscribe({
      next: (u) => {
        this.showSuccess('RF-23 | Usuario actualizado', `Usuario "${u.nombreUsuario}" actualizado.`);
        this.api.listarUsuarios().subscribe((l) => this.usuarios.set(l));
      },
      error: (err) => this.handleApiError(err, 'Error al actualizar usuario (RF-23)')
    });
  }

  filtrarAuditoria(filtros: { tablaAfectada?: string | null; accion?: string | null; idUsuario?: number | null }): void {
    if (!this.isAdmin()) return;
    this.api.listarAuditoria(filtros).subscribe({
      next: (logs) => this.auditoria.set(logs),
      error: (err) => this.handleApiError(err, 'Error al consultar bitácora de auditoría (RF-24)')
    });
  }
}
