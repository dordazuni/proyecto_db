package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.LogAuditoria;
import co.edu.unbosque.apihorarios.model.Rol;
import co.edu.unbosque.apihorarios.model.Usuario;
import co.edu.unbosque.apihorarios.service.SeguridadAuditoriaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.List;

@RestController
public class SeguridadAuditoriaController {

    private final SeguridadAuditoriaService seguridadAuditoriaService;

    public SeguridadAuditoriaController(SeguridadAuditoriaService seguridadAuditoriaService) {
        this.seguridadAuditoriaService = seguridadAuditoriaService;
    }

    // =====================================================================
    // RF-23 y RF-25: Gestión de Usuarios y Roles
    // =====================================================================
    @GetMapping("/roles")
    public ResponseEntity<List<Rol>> listarRoles() throws SQLException {
        return ResponseEntity.ok(seguridadAuditoriaService.listarRoles());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> listarUsuarios() throws SQLException {
        return ResponseEntity.ok(seguridadAuditoriaService.listarUsuarios());
    }

    @GetMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> obtenerUsuario(@PathVariable int id) throws SQLException {
        return ResponseEntity.ok(seguridadAuditoriaService.obtenerUsuarioPorId(id));
    }

    @PostMapping("/usuarios")
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) throws SQLException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(seguridadAuditoriaService.crearUsuario(usuario));
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable int id,
                                                     @RequestBody Usuario usuario) throws SQLException {
        return ResponseEntity.ok(seguridadAuditoriaService.actualizarUsuario(id, usuario));
    }

    // =====================================================================
    // RF-24: Consulta de Bitácora de Auditoría (solo inserción por triggers en BD)
    // =====================================================================
    @GetMapping("/auditoria")
    public ResponseEntity<List<LogAuditoria>> listarAuditoria(
            @RequestParam(required = false) String tablaAfectada,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) Integer idUsuario) throws SQLException {
        return ResponseEntity.ok(seguridadAuditoriaService.listarAuditoria(tablaAfectada, accion, idUsuario));
    }
}
