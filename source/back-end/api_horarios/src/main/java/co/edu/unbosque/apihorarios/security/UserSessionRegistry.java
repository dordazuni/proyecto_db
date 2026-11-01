package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestor de sesiones activas en memoria de Spring Boot.
 * Permite saber qué usuarios están logueados en tiempo real sin requerir
 * modificaciones en el esquema relacional de PostgreSQL.
 */
@Component
public class UserSessionRegistry {

    public record ActiveSession(
            Integer idUsuario,
            String nombreUsuario,
            String nombreRol,
            Integer idDocente,
            Instant loginTime,
            Instant lastAccessTime,
            String token
    ) {}

    // Mapa de idUsuario -> ActiveSession
    private final Map<Integer, ActiveSession> activeSessionsByUserId = new ConcurrentHashMap<>();

    // Mapa de token -> idUsuario para verificación rápida en AuthFilter
    private final Map<String, Integer> tokenToUserId = new ConcurrentHashMap<>();

    public void registerSession(Usuario usuario, String token) {
        if (usuario == null || usuario.getIdUsuario() == null) return;
        Instant now = Instant.now();
        ActiveSession session = new ActiveSession(
                usuario.getIdUsuario(),
                usuario.getNombreUsuario(),
                usuario.getNombreRol(),
                usuario.getIdDocente(),
                now,
                now,
                token
        );
        activeSessionsByUserId.put(usuario.getIdUsuario(), session);
        tokenToUserId.put(token, usuario.getIdUsuario());
    }

    public boolean isUserLoggedIn(Integer idUsuario) {
        return idUsuario != null && activeSessionsByUserId.containsKey(idUsuario);
    }

    public boolean isTokenActive(String token) {
        if (token == null) return false;
        return tokenToUserId.containsKey(token);
    }

    public void updateAccessTime(Integer idUsuario, String token) {
        if (idUsuario == null) return;
        ActiveSession current = activeSessionsByUserId.get(idUsuario);
        if (current != null) {
            ActiveSession updated = new ActiveSession(
                    current.idUsuario(),
                    current.nombreUsuario(),
                    current.nombreRol(),
                    current.idDocente(),
                    current.loginTime(),
                    Instant.now(),
                    token != null ? token : current.token()
            );
            activeSessionsByUserId.put(idUsuario, updated);
            if (token != null && !token.equals(current.token())) {
                tokenToUserId.remove(current.token());
                tokenToUserId.put(token, idUsuario);
            }
        }
    }

    public void removeSession(Integer idUsuario) {
        if (idUsuario == null) return;
        ActiveSession removed = activeSessionsByUserId.remove(idUsuario);
        if (removed != null && removed.token() != null) {
            tokenToUserId.remove(removed.token());
        }
    }

    public void removeSessionByToken(String token) {
        if (token == null) return;
        Integer userId = tokenToUserId.remove(token);
        if (userId != null) {
            activeSessionsByUserId.remove(userId);
        }
    }

    public List<ActiveSession> getActiveSessions() {
        return new ArrayList<>(activeSessionsByUserId.values());
    }
}
