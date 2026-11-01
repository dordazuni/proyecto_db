package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestor de sesiones activas en memoria de Spring Boot.
 * Permite saber qué usuarios están logueados en tiempo real sin requerir
 * modificaciones en el esquema relacional de PostgreSQL.
 * RNF-04: Los tokens JWT nunca deben exponerse públicamente en endpoints de consulta.
 */
@Component
public class UserSessionRegistry {

    private static final Duration SESSION_MAX_IDLE = Duration.ofHours(24);

    public record ActiveSessionDto(
            Integer idUsuario,
            String nombreUsuario,
            String nombreRol,
            Integer idDocente,
            Instant loginTime,
            Instant lastAccessTime
    ) {}

    public record ActiveSession(
            Integer idUsuario,
            String nombreUsuario,
            String nombreRol,
            Integer idDocente,
            Instant loginTime,
            Instant lastAccessTime,
            @JsonIgnore
            String token
    ) {
        public ActiveSessionDto toDto() {
            return new ActiveSessionDto(idUsuario, nombreUsuario, nombreRol, idDocente, loginTime, lastAccessTime);
        }
    }

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
        if (token != null) {
            tokenToUserId.put(token, usuario.getIdUsuario());
        }
    }

    public boolean isUserLoggedIn(Integer idUsuario) {
        if (idUsuario == null) return false;
        cleanExpiredSessions();
        return activeSessionsByUserId.containsKey(idUsuario);
    }

    public boolean isTokenActive(String token) {
        if (token == null) return false;
        cleanExpiredSessions();
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
                if (current.token() != null) {
                    tokenToUserId.remove(current.token());
                }
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

    public List<ActiveSessionDto> getActiveSessionDtos() {
        cleanExpiredSessions();
        return activeSessionsByUserId.values().stream()
                .map(ActiveSession::toDto)
                .toList();
    }

    public List<ActiveSessionDto> getActiveSessions() {
        return getActiveSessionDtos();
    }

    private void cleanExpiredSessions() {
        Instant threshold = Instant.now().minus(SESSION_MAX_IDLE);
        activeSessionsByUserId.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().lastAccessTime().isBefore(threshold);
            if (expired && entry.getValue().token() != null) {
                tokenToUserId.remove(entry.getValue().token());
            }
            return expired;
        });
    }
}
