package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SeguridadAuthUnitTests {

    private static final String TEST_SECRET = "SIGH_JWT_Secret_Key_2026_UnBosque_Test_Only_Key";

    @AfterEach
    void limpiarContexto() {
        AuthContextHolder.clear();
    }

    @Test
    void generarYValidarTokenJwtSinTocarBaseDeDatos() {
        AuthTokenService tokenService = new AuthTokenService(TEST_SECRET);

        Usuario admin = new Usuario(1, "admin", null, true, 1, "ADMINISTRADOR", null, null);

        String token = tokenService.generateToken(admin);
        assertNotNull(token);
        assertEquals(3, token.split("\\.").length, "El token debe tener estructura JWT (header.payload.signature)");

        Usuario verificado = tokenService.verifyToken(token);
        assertEquals(1, verificado.getIdUsuario());
        assertEquals("admin", verificado.getNombreUsuario());
        assertEquals("ADMINISTRADOR", verificado.getNombreRol());
        assertNull(verificado.getIdDocente());
    }

    @Test
    void generarYValidarTokenDocenteConIdDocente() {
        AuthTokenService tokenService = new AuthTokenService(TEST_SECRET);

        Usuario docente = new Usuario(4, "ana.rojas", null, true, 4, "DOCENTE", 1, "Ana María Rojas");

        String token = tokenService.generateToken(docente);
        Usuario verificado = tokenService.verifyToken(token);

        assertEquals(4, verificado.getIdUsuario());
        assertEquals("ana.rojas", verificado.getNombreUsuario());
        assertEquals("DOCENTE", verificado.getNombreRol());
        assertEquals(1, verificado.getIdDocente());
    }

    @Test
    void rechazarTokenManipuladoCon401() {
        AuthTokenService tokenService = new AuthTokenService(TEST_SECRET);

        Usuario coordinador = new Usuario(2, "coordinador", null, true, 2, "COORDINADOR", null, null);

        String token = tokenService.generateToken(coordinador);
        String tokenManipulado = token.substring(0, token.length() - 4) + "XXXX";

        assertThrows(UnauthorizedException.class, () -> tokenService.verifyToken(tokenManipulado));
    }

    @Test
    void verificarContextoDeRolPorHilo() {
        Usuario aprobador = new Usuario(3, "aprobador", null, true, 3, "APROBADOR", null, null);
        AuthContextHolder.setCurrentUser(aprobador);

        assertEquals(3, AuthContextHolder.requireCurrentUserId());
        assertEquals("APROBADOR", AuthContextHolder.getCurrentUser().getNombreRol());

        AuthContextHolder.clear();
        assertNull(AuthContextHolder.getCurrentUser());
        assertThrows(UnauthorizedException.class, AuthContextHolder::requireCurrentUserId);
    }
}
