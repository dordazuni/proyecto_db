package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.Disponibilidad;
import co.edu.unbosque.apihorarios.model.Seccion;
import co.edu.unbosque.apihorarios.service.PlaneacionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@RestController
public class PlaneacionController {

    private final PlaneacionService planeacionService;

    public PlaneacionController(PlaneacionService planeacionService) {
        this.planeacionService = planeacionService;
    }

    // =====================================================================
    // RF-09 y RF-10: Apertura de Secciones, Matrícula Real y Cierre
    // =====================================================================
    @GetMapping("/secciones")
    public ResponseEntity<List<Seccion>> listarSecciones(
            @RequestParam(required = false) Integer idPeriodo,
            @RequestParam(required = false) Integer idCurso) throws SQLException {
        return ResponseEntity.ok(planeacionService.listarSecciones(idPeriodo, idCurso));
    }

    @GetMapping("/secciones/{id}")
    public ResponseEntity<Seccion> obtenerSeccion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(planeacionService.obtenerSeccionPorId(id));
    }

    @PostMapping("/secciones")
    public ResponseEntity<Seccion> crearSeccion(@RequestBody Seccion seccion) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED).body(planeacionService.crearSeccion(seccion));
    }

    @PutMapping("/secciones/{id}")
    public ResponseEntity<Seccion> actualizarSeccion(@PathVariable int id,
                                                     @RequestBody Seccion seccion) throws SQLException {
        return ResponseEntity.ok(planeacionService.actualizarSeccion(id, seccion));
    }

    @PatchMapping("/secciones/{id}/matricula-real")
    public ResponseEntity<Seccion> registrarMatriculaReal(@PathVariable int id,
                                                          @RequestBody Map<String, Integer> body) throws SQLException {
        Integer matriculaReal = body.get("matriculaReal");
        if (matriculaReal == null) {
            throw new IllegalArgumentException("El campo 'matriculaReal' es obligatorio");
        }
        return ResponseEntity.ok(planeacionService.registrarMatriculaReal(id, matriculaReal));
    }

    @PatchMapping("/secciones/{id}/cerrar")
    public ResponseEntity<Seccion> cerrarSeccion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(planeacionService.cerrarSeccion(id));
    }

    @PatchMapping("/secciones/{id}/estado")
    public ResponseEntity<Seccion> cambiarEstadoSeccion(@PathVariable int id,
                                                        @RequestBody Map<String, String> body) throws SQLException {
        String estado = body.get("estado");
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El campo 'estado' es obligatorio ('ABIERTA' o 'CERRADA')");
        }
        return ResponseEntity.ok(planeacionService.cambiarEstadoSeccion(id, estado));
    }

    // =====================================================================
    // RF-11: Disponibilidad de Docentes por Franja y Período
    // =====================================================================
    @GetMapping("/disponibilidad")
    public ResponseEntity<List<Disponibilidad>> listarDisponibilidad(
            @RequestParam(required = false) Integer idDocente,
            @RequestParam(required = false) Integer idPeriodo) throws SQLException {
        return ResponseEntity.ok(planeacionService.listarDisponibilidad(idDocente, idPeriodo));
    }

    @PostMapping("/disponibilidad")
    public ResponseEntity<Disponibilidad> registrarDisponibilidad(
            @RequestBody Disponibilidad disponibilidad) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planeacionService.registrarDisponibilidad(disponibilidad));
    }

    @PutMapping("/disponibilidad")
    public ResponseEntity<Disponibilidad> actualizarDisponibilidad(
            @RequestBody Disponibilidad disponibilidad) throws SQLException {
        return ResponseEntity.ok(planeacionService.registrarDisponibilidad(disponibilidad));
    }

    @DeleteMapping("/disponibilidad")
    public ResponseEntity<Map<String, String>> eliminarDisponibilidad(
            @RequestParam int idDocente,
            @RequestParam int idPeriodo,
            @RequestParam int idFranja) throws SQLException {
        planeacionService.eliminarDisponibilidad(idDocente, idPeriodo, idFranja);
        return ResponseEntity.ok(Map.of("message", "Registro de disponibilidad eliminado (franja vuelve a estar disponible)"));
    }
}
