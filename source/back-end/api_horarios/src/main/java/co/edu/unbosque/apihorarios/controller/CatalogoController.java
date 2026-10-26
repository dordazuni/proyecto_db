package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.Curso;
import co.edu.unbosque.apihorarios.model.CursoRecurso;
import co.edu.unbosque.apihorarios.model.Docente;
import co.edu.unbosque.apihorarios.model.DocenteCurso;
import co.edu.unbosque.apihorarios.model.Espacio;
import co.edu.unbosque.apihorarios.model.EspacioRecurso;
import co.edu.unbosque.apihorarios.model.Franja;
import co.edu.unbosque.apihorarios.model.ParametroSistema;
import co.edu.unbosque.apihorarios.model.PeriodoAcademico;
import co.edu.unbosque.apihorarios.model.Recurso;
import co.edu.unbosque.apihorarios.model.TipoContrato;
import co.edu.unbosque.apihorarios.service.CatalogoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@RestController
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    // =====================================================================
    // RF-01: Períodos Académicos
    // =====================================================================
    @GetMapping("/periodos")
    public ResponseEntity<List<PeriodoAcademico>> listarPeriodos() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarPeriodos());
    }

    @GetMapping("/periodos/{id}")
    public ResponseEntity<PeriodoAcademico> obtenerPeriodo(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(catalogoService.obtenerPeriodoPorId(id));
    }

    @PostMapping("/periodos")
    public ResponseEntity<PeriodoAcademico> crearPeriodo(@RequestBody PeriodoAcademico periodo) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.crearPeriodo(periodo));
    }

    @PutMapping("/periodos/{id}")
    public ResponseEntity<PeriodoAcademico> actualizarPeriodo(@PathVariable int id,
                                                              @RequestBody PeriodoAcademico periodo) throws SQLException {
        return ResponseEntity.ok(catalogoService.actualizarPeriodo(id, periodo));
    }

    // =====================================================================
    // RF-02: Docentes y Tipos de Contrato (solo lectura desde la aplicación, RN-19)
    // =====================================================================
    @GetMapping("/tipos-contrato")
    public ResponseEntity<List<TipoContrato>> listarTiposContrato() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarTiposContrato());
    }

    @GetMapping("/docentes")
    public ResponseEntity<List<Docente>> listarDocentes() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarDocentes());
    }

    @GetMapping("/docentes/{id}")
    public ResponseEntity<Docente> obtenerDocente(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(catalogoService.obtenerDocentePorId(id));
    }

    // =====================================================================
    // RF-03: Espacios (solo lectura desde la aplicación, RN-19)
    // =====================================================================
    @GetMapping("/espacios")
    public ResponseEntity<List<Espacio>> listarEspacios() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarEspacios());
    }

    @GetMapping("/espacios/{id}")
    public ResponseEntity<Espacio> obtenerEspacio(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(catalogoService.obtenerEspacioPorId(id));
    }

    // =====================================================================
    // RF-04: Catálogo de Recursos y Dotación de Espacios
    // =====================================================================
    @GetMapping("/recursos")
    public ResponseEntity<List<Recurso>> listarRecursos() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarRecursos());
    }

    @PostMapping("/recursos")
    public ResponseEntity<Recurso> crearRecurso(@RequestBody Recurso recurso) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.crearRecurso(recurso));
    }

    @PutMapping("/recursos/{id}")
    public ResponseEntity<Recurso> actualizarRecurso(@PathVariable int id,
                                                     @RequestBody Recurso recurso) throws SQLException {
        return ResponseEntity.ok(catalogoService.actualizarRecurso(id, recurso));
    }

    @GetMapping("/espacios/{idEspacio}/recursos")
    public ResponseEntity<List<EspacioRecurso>> listarRecursosDeEspacio(@PathVariable int idEspacio) throws SQLException {
        return ResponseEntity.ok(catalogoService.listarRecursosPorEspacio(idEspacio));
    }

    @PostMapping("/espacios/{idEspacio}/recursos")
    public ResponseEntity<EspacioRecurso> asignarRecursoAEspacio(@PathVariable int idEspacio,
                                                                 @RequestBody EspacioRecurso body) throws SQLException {
        int cantidad = body.getCantidad() != null ? body.getCantidad() : 1;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoService.asignarRecursoAEspacio(idEspacio, body.getIdRecurso(), cantidad));
    }

    @PutMapping("/espacios/{idEspacio}/recursos/{idRecurso}")
    public ResponseEntity<EspacioRecurso> actualizarRecursoDeEspacio(@PathVariable int idEspacio,
                                                                     @PathVariable int idRecurso,
                                                                     @RequestBody EspacioRecurso body) throws SQLException {
        int cantidad = body.getCantidad() != null ? body.getCantidad() : 1;
        return ResponseEntity.ok(catalogoService.asignarRecursoAEspacio(idEspacio, idRecurso, cantidad));
    }

    @DeleteMapping("/espacios/{idEspacio}/recursos/{idRecurso}")
    public ResponseEntity<Map<String, String>> eliminarRecursoDeEspacio(@PathVariable int idEspacio,
                                                                        @PathVariable int idRecurso) throws SQLException {
        catalogoService.eliminarRecursoDeEspacio(idEspacio, idRecurso);
        return ResponseEntity.ok(Map.of("message", "Recurso retirado del espacio correctamente"));
    }

    // =====================================================================
    // RF-05: Cursos y Recursos Requeridos por Curso
    // =====================================================================
    @GetMapping("/cursos")
    public ResponseEntity<List<Curso>> listarCursos() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarCursos());
    }

    @GetMapping("/cursos/{id}")
    public ResponseEntity<Curso> obtenerCurso(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(catalogoService.obtenerCursoPorId(id));
    }

    @PostMapping("/cursos")
    public ResponseEntity<Curso> crearCurso(@RequestBody Curso curso) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.crearCurso(curso));
    }

    @PutMapping("/cursos/{id}")
    public ResponseEntity<Curso> actualizarCurso(@PathVariable int id,
                                                 @RequestBody Curso curso) throws SQLException {
        return ResponseEntity.ok(catalogoService.actualizarCurso(id, curso));
    }

    @GetMapping("/cursos/{idCurso}/recursos")
    public ResponseEntity<List<CursoRecurso>> listarRecursosDeCurso(@PathVariable int idCurso) throws SQLException {
        return ResponseEntity.ok(catalogoService.listarRecursosDeCurso(idCurso));
    }

    @PostMapping("/cursos/{idCurso}/recursos")
    public ResponseEntity<CursoRecurso> agregarRecursoACurso(@PathVariable int idCurso,
                                                             @RequestBody CursoRecurso body) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoService.agregarRecursoACurso(idCurso, body.getIdRecurso()));
    }

    @DeleteMapping("/cursos/{idCurso}/recursos/{idRecurso}")
    public ResponseEntity<Map<String, String>> eliminarRecursoDeCurso(@PathVariable int idCurso,
                                                                      @PathVariable int idRecurso) throws SQLException {
        catalogoService.eliminarRecursoDeCurso(idCurso, idRecurso);
        return ResponseEntity.ok(Map.of("message", "Recurso eliminado de los requisitos del curso"));
    }

    // =====================================================================
    // RF-06: Habilitación de Docentes por Curso (docente_curso)
    // =====================================================================
    @GetMapping("/docentes/{idDocente}/cursos")
    public ResponseEntity<List<DocenteCurso>> listarCursosPorDocente(@PathVariable int idDocente) throws SQLException {
        return ResponseEntity.ok(catalogoService.listarCursosPorDocente(idDocente));
    }

    @GetMapping("/cursos/{idCurso}/docentes")
    public ResponseEntity<List<DocenteCurso>> listarDocentesPorCurso(@PathVariable int idCurso) throws SQLException {
        return ResponseEntity.ok(catalogoService.listarDocentesPorCurso(idCurso));
    }

    @PostMapping("/docentes/{idDocente}/cursos")
    public ResponseEntity<DocenteCurso> habilitarDocenteEnCurso(@PathVariable int idDocente,
                                                                @RequestBody DocenteCurso body) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoService.habilitarDocenteEnCurso(idDocente, body.getIdCurso()));
    }

    @DeleteMapping("/docentes/{idDocente}/cursos/{idCurso}")
    public ResponseEntity<Map<String, String>> deshabilitarDocenteEnCurso(@PathVariable int idDocente,
                                                                          @PathVariable int idCurso) throws SQLException {
        catalogoService.deshabilitarDocenteEnCurso(idDocente, idCurso);
        return ResponseEntity.ok(Map.of("message", "Habilitación de curso retirada al docente"));
    }

    // =====================================================================
    // RF-07: Catálogo de Franjas Horarias
    // =====================================================================
    @GetMapping("/franjas")
    public ResponseEntity<List<Franja>> listarFranjas() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarFranjas());
    }

    @GetMapping("/franjas/{id}")
    public ResponseEntity<Franja> obtenerFranja(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(catalogoService.obtenerFranjaPorId(id));
    }

    @PostMapping("/franjas")
    public ResponseEntity<Franja> crearFranja(@RequestBody Franja franja) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.crearFranja(franja));
    }

    @PutMapping("/franjas/{id}")
    public ResponseEntity<Franja> actualizarFranja(@PathVariable int id,
                                                   @RequestBody Franja franja) throws SQLException {
        return ResponseEntity.ok(catalogoService.actualizarFranja(id, franja));
    }

    // =====================================================================
    // RF-08: Parámetros del Sistema
    // =====================================================================
    @GetMapping("/parametros")
    public ResponseEntity<List<ParametroSistema>> listarParametros() throws SQLException {
        return ResponseEntity.ok(catalogoService.listarParametros());
    }

    @PutMapping("/parametros/{clave}")
    public ResponseEntity<ParametroSistema> actualizarParametro(@PathVariable String clave,
                                                                @RequestBody ParametroSistema parametro) throws SQLException {
        return ResponseEntity.ok(catalogoService.actualizarParametro(clave, parametro));
    }
}
