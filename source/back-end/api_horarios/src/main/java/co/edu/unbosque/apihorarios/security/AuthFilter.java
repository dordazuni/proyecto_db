package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class AuthFilter extends OncePerRequestFilter {

    private final AuthTokenService authTokenService;
    private final UserSessionRegistry sessionRegistry;

    public AuthFilter(AuthTokenService authTokenService, UserSessionRegistry sessionRegistry) {
        this.authTokenService = authTokenService;
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        if (path == null || path.isEmpty()) {
            path = request.getRequestURI();
        }

        // Endpoints públicos sin token: GET /echo, POST /auth/login
        boolean isEcho = "GET".equalsIgnoreCase(request.getMethod())
                && (path.equals("/echo") || path.endsWith("/api/echo"));
        boolean isLogin = "POST".equalsIgnoreCase(request.getMethod())
                && (path.equals("/auth/login") || path.endsWith("/api/auth/login")
                    || path.equals("/login") || path.endsWith("/api/login"));

        if (isEcho || isLogin) {
            try {
                AuthContextHolder.setForceAuthLookup(true);
                filterChain.doFilter(request, response);
            } finally {
                AuthContextHolder.clear();
            }
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            writeUnauthorized(response, "Token de autenticación ausente. Inicie sesión en /api/auth/login.");
            return;
        }

        String token = authHeader.substring(7).trim();
        try {
            // RNF-04: Verifica la firma y vigencia del token. Tokens expirados son rechazados con 401.
            Usuario usuario = authTokenService.verifyToken(token);
            sessionRegistry.updateAccessTime(usuario.getIdUsuario(), token);
            AuthContextHolder.setCurrentUser(usuario);
            filterChain.doFilter(request, response);
        } catch (UnauthorizedException ex) {
            writeUnauthorized(response, ex.getMessage());
        } finally {
            AuthContextHolder.clear();
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String json = String.format(
                "{\"status\":401,\"regla\":\"RF-23\",\"message\":\"%s\",\"sqlState\":null,\"timestamp\":\"%s\"}",
                message.replace("\"", "\\\""),
                LocalDateTime.now()
        );
        response.getWriter().write(json);
    }
}
