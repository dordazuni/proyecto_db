package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;

public final class AuthContextHolder {

    private static final ThreadLocal<Usuario> CURRENT_USER = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> FORCE_AUTH_LOOKUP = ThreadLocal.withInitial(() -> false);

    private AuthContextHolder() {
    }

    public static void setCurrentUser(Usuario usuario) {
        CURRENT_USER.set(usuario);
    }

    public static Usuario getCurrentUser() {
        return CURRENT_USER.get();
    }

    public static int requireCurrentUserId() {
        Usuario u = CURRENT_USER.get();
        if (u == null || u.getIdUsuario() == null) {
            throw new UnauthorizedException("RF-23", "Sesión no válida o expirada.");
        }
        return u.getIdUsuario();
    }

    public static void setForceAuthLookup(boolean force) {
        FORCE_AUTH_LOOKUP.set(force);
    }

    public static boolean isForceAuthLookup() {
        return Boolean.TRUE.equals(FORCE_AUTH_LOOKUP.get());
    }

    public static void clear() {
        CURRENT_USER.remove();
        FORCE_AUTH_LOOKUP.remove();
    }
}
