package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.LogAuditoria;
import co.edu.unbosque.apihorarios.model.Rol;
import co.edu.unbosque.apihorarios.model.Usuario;
import co.edu.unbosque.apihorarios.repository.SeguridadAuditoriaRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.HexFormat;
import java.util.List;

@Service
public class SeguridadAuditoriaService {

    private final SeguridadAuditoriaRepository seguridadAuditoriaRepository;

    public SeguridadAuditoriaService(SeguridadAuditoriaRepository seguridadAuditoriaRepository) {
        this.seguridadAuditoriaRepository = seguridadAuditoriaRepository;
    }

    public List<Rol> listarRoles() throws SQLException {
        return seguridadAuditoriaRepository.listarRoles();
    }

    public List<Usuario> listarUsuarios() throws SQLException {
        return seguridadAuditoriaRepository.listarUsuarios();
    }

    public Usuario obtenerUsuarioPorId(int idUsuario) throws SQLException {
        return seguridadAuditoriaRepository.obtenerUsuarioPorId(idUsuario);
    }

    public Usuario crearUsuario(Usuario usuario) throws SQLException {
        if (usuario.getContrasena() == null || usuario.getContrasena().isBlank()) {
            throw new IllegalArgumentException("La contraseña es requerida para crear un usuario");
        }
        String hash = hashPassword(usuario.getContrasena());
        return seguridadAuditoriaRepository.crearUsuario(usuario, hash);
    }

    public Usuario actualizarUsuario(int idUsuario, Usuario usuario) throws SQLException {
        String hash = null;
        if (usuario.getContrasena() != null && !usuario.getContrasena().isBlank()) {
            hash = hashPassword(usuario.getContrasena());
        }
        return seguridadAuditoriaRepository.actualizarUsuario(idUsuario, usuario, hash);
    }

    public List<LogAuditoria> listarAuditoria(String tablaAfectada, String accion, Integer idUsuario) throws SQLException {
        return seguridadAuditoriaRepository.listarAuditoria(tablaAfectada, accion, idUsuario);
    }

    // RNF-04: Las contraseñas se guardan como hash, nunca en texto plano
    private String hashPassword(String rawPassword) {
        if (rawPassword.startsWith("$2a$") || rawPassword.startsWith("$2b$") || rawPassword.length() == 64) {
            return rawPassword;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No se pudo generar el hash SHA-256 de la contraseña", e);
        }
    }
}
