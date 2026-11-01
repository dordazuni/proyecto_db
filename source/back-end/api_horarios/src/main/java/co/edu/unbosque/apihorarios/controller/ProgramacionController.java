package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.Asignacion;
import co.edu.unbosque.apihorarios.model.VersionHorario;
import co.edu.unbosque.apihorarios.service.ProgramacionService;
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
public class ProgramacionController {

    private final ProgramacionService programacionService;

    public ProgramacionController(ProgramacionService programacionService) {
        this.programacionService = programacionService;
    }

    // =====================================================================
    // RF-12: Versiones de Horario
    // =====================================================================
    @GetMapping("/versiones")
    public ResponseEntity<List<VersionHorario>> listarVersiones(
            @RequestParam(required = false) Integer idPeriodo) throws SQLException {
        return ResponseEntity.ok(programacionService.listarVersiones(idPeriodo));
    }

    @GetMapping("/versiones/{id}")
    public ResponseEntity<VersionHorario> obtenerVersion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(programacionService.obtenerVersionPorId(id));
    }

    @PostMapping("/versiones")
    public ResponseEntity<VersionHorario> crearVersion(
            @RequestBody VersionHorario version) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programacionService.crearVersion(version));
    }

    // =====================================================================
    // RF-15: Enviar versión a aprobación (EN_EDICION -> PENDIENTE)
    // =====================================================================
    @PatchMapping("/versiones/{id}/enviar-aprobacion")
    public ResponseEntity<VersionHorario> enviarAAprobacion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(programacionService.enviarAAprobacion(id));
    }

    // =====================================================================
    // RF-16: Avalar versión (PENDIENTE -> AVALADO) o devolverla a EN_EDICION
    // =====================================================================
    @PatchMapping("/versiones/{id}/avalar")
    public ResponseEntity<VersionHorario> avalarVersion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(programacionService.avalarVersion(id));
    }

    @PatchMapping("/versiones/{id}/devolver")
    public ResponseEntity<VersionHorario> devolverVersion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(programacionService.devolverVersion(id));
    }

    // =====================================================================
    // RF-17: Sincronizar versión con repositorio documental externo (AVALADO -> SINCRONIZADO)
    // =====================================================================
    @PatchMapping("/versiones/{id}/sincronizar")
    public ResponseEntity<VersionHorario> sincronizarVersion(
            @PathVariable int id,
            @RequestBody VersionHorario body) throws SQLException {
        if (body == null || body.getIdDocumentoExterno() == null || body.getIdDocumentoExterno().isBlank()) {
            throw new IllegalArgumentException("El campo 'idDocumentoExterno' es obligatorio para sincronizar");
        }
        return ResponseEntity.ok(programacionService.sincronizarVersion(id, body.getIdDocumentoExterno()));
    }

    // =====================================================================
    // RF-18: Crear una versión nueva a partir de una avalada (clonar versión)
    // =====================================================================
    @PostMapping("/versiones/{id}/clonar")
    public ResponseEntity<VersionHorario> clonarVersion(@PathVariable int id) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programacionService.clonarVersion(id));
    }

    // =====================================================================
    // RF-13 y RF-14: Asignación, Modificación y Eliminación de Sesiones
    // =====================================================================
    @GetMapping("/asignaciones")
    public ResponseEntity<List<Asignacion>> listarAsignaciones(
            @RequestParam(required = false) Integer idVersion) throws SQLException {
        return ResponseEntity.ok(programacionService.listarAsignaciones(idVersion));
    }

    @GetMapping("/asignaciones/{id}")
    public ResponseEntity<Asignacion> obtenerAsignacion(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(programacionService.obtenerAsignacionPorId(id));
    }

    @PostMapping("/asignaciones")
    public ResponseEntity<Asignacion> crearAsignacion(@RequestBody Asignacion asignacion) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programacionService.crearAsignacion(asignacion));
    }

    @PutMapping("/asignaciones/{id}")
    public ResponseEntity<Asignacion> actualizarAsignacion(
            @PathVariable int id,
            @RequestBody Asignacion asignacion) throws SQLException {
        return ResponseEntity.ok(programacionService.actualizarAsignacion(id, asignacion));
    }

    @DeleteMapping("/asignaciones/{id}")
    public ResponseEntity<Map<String, String>> eliminarAsignacion(@PathVariable int id) throws SQLException {
        programacionService.eliminarAsignacion(id);
        return ResponseEntity.ok(Map.of("message", "Asignación eliminada exitosamente"));
    }
}
