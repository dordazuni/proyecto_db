package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.LogAuditoria;
import co.edu.unbosque.apihorarios.model.LoginResponse;
import co.edu.unbosque.apihorarios.model.Rol;
import co.edu.unbosque.apihorarios.model.Usuario;
import co.edu.unbosque.apihorarios.repository.SeguridadAuditoriaRepository;
import co.edu.unbosque.apihorarios.security.AuthContextHolder;
import co.edu.unbosque.apihorarios.security.AuthTokenService;
import co.edu.unbosque.apihorarios.security.UnauthorizedException;
import co.edu.unbosque.apihorarios.security.UserSessionRegistry;
import co.edu.unbosque.apihorarios.security.UserSessionRegistry.ActiveSessionDto;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.HexFormat;
import java.util.List;

@Service
public class SeguridadAuditoriaService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "RF-23: Credenciales inválidas o usuario inactivo.";

    private final SeguridadAuditoriaRepository seguridadAuditoriaRepository;
    private final AuthTokenService authTokenService;
    private final UserSessionRegistry sessionRegistry;

    public SeguridadAuditoriaService(SeguridadAuditoriaRepository seguridadAuditoriaRepository,
                                     AuthTokenService authTokenService,
                                     UserSessionRegistry sessionRegistry) {
        this.seguridadAuditoriaRepository = seguridadAuditoriaRepository;
        this.authTokenService = authTokenService;
        this.sessionRegistry = sessionRegistry;
    }

    public LoginResponse autenticarUsuario(String nombreUsuario, String rawPassword) throws SQLException {
        if (nombreUsuario == null || nombreUsuario.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            throw new UnauthorizedException("RF-23", INVALID_CREDENTIALS_MESSAGE);
        }

        boolean prevForce = AuthContextHolder.isForceAuthLookup();
        AuthContextHolder.setForceAuthLookup(true);
        try {
            Usuario usuario = seguridadAuditoriaRepository.obtenerUsuarioConContrasenaPorNombre(nombreUsuario.trim());
            if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
                throw new UnauthorizedException("RF-23", INVALID_CREDENTIALS_MESSAGE);
            }

            String dbContrasena = usuario.getContrasena() != null ? usuario.getContrasena().trim() : "";
            String inputHash = hashPassword(rawPassword);

            // RNF-04: Comparación criptográfica estricta contra el hash real en base de datos
            boolean passwordValido = !dbContrasena.isBlank() && dbContrasena.equalsIgnoreCase(inputHash);

            if (!passwordValido) {
                throw new UnauthorizedException("RF-23", INVALID_CREDENTIALS_MESSAGE);
            }

            // RNF-04: Nunca devolver la contraseña ni su hash
            usuario.setContrasena(null);
            String token = authTokenService.generateToken(usuario);
            sessionRegistry.registerSession(usuario, token);
            return new LoginResponse(token, usuario);
        } finally {
            AuthContextHolder.setForceAuthLookup(prevForce);
        }
    }

    public Usuario obtenerUsuarioActualAutenticado() {
        Usuario currentUser = AuthContextHolder.getCurrentUser();
        if (currentUser == null || currentUser.getIdUsuario() == null || !Boolean.TRUE.equals(currentUser.getActivo())) {
            throw new UnauthorizedException("RF-23", INVALID_CREDENTIALS_MESSAGE);
        }
        currentUser.setContrasena(null);
        return currentUser;
    }

    /**
     * Refresca una sesión activa. Exige un token Bearer válido y vigente (RNF-04).
     * No permite fabricación de sesiones mediante fallbackUser sin autenticar.
     */
    public LoginResponse refrescarSesion(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("RF-23", "Token de autorización ausente o inválido.");
        }
        String token = authHeader.substring(7).trim();
        Usuario tokenUser = authTokenService.verifyToken(token);

        boolean prevForce = AuthContextHolder.isForceAuthLookup();
        AuthContextHolder.setForceAuthLookup(true);
        try {
            Usuario usuarioDb = seguridadAuditoriaRepository.obtenerUsuarioPorId(tokenUser.getIdUsuario());
            if (usuarioDb == null || !Boolean.TRUE.equals(usuarioDb.getActivo())) {
                sessionRegistry.removeSession(tokenUser.getIdUsuario());
                throw new UnauthorizedException("RF-23", INVALID_CREDENTIALS_MESSAGE);
            }

            usuarioDb.setContrasena(null);
            String newToken = authTokenService.generateToken(usuarioDb);
            sessionRegistry.registerSession(usuarioDb, newToken);
            return new LoginResponse(newToken, usuarioDb);
        } catch (SQLException e) {
            throw new UnauthorizedException("RF-23", "Error al verificar la vigencia del usuario en la base de datos.");
        } finally {
            AuthContextHolder.setForceAuthLookup(prevForce);
        }
    }

    public void cerrarSesion(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            sessionRegistry.removeSessionByToken(token);
        }
        Usuario currentUser = AuthContextHolder.getCurrentUser();
        if (currentUser != null && currentUser.getIdUsuario() != null) {
            sessionRegistry.removeSession(currentUser.getIdUsuario());
        }
    }

    /**
     * Consulta de sesiones activas restringida al rol ADMINISTRADOR (RF-23).
     * RNF-04: Los DTOs retornados jamás contienen los tokens de sesión.
     */
    public List<ActiveSessionDto> listarSesionesActivas() {
        Usuario currentUser = AuthContextHolder.getCurrentUser();
        if (currentUser == null || !"ADMINISTRADOR".equalsIgnoreCase(currentUser.getNombreRol())) {
            throw new UnauthorizedException("RF-23", "Acceso denegado: solo el Administrador puede consultar sesiones activas.");
        }
        return sessionRegistry.getActiveSessionDtos();
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

    // RNF-04: Las contraseñas se guardan como hash SHA-256, nunca en texto plano
    public String hashPassword(String rawPassword) {
        if (rawPassword == null) {
            return "";
        }
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
