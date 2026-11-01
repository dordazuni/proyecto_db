package co.edu.unbosque.apihorarios.repository;

import co.edu.unbosque.apihorarios.model.LogAuditoria;
import co.edu.unbosque.apihorarios.model.Rol;
import co.edu.unbosque.apihorarios.model.Usuario;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Repository
public class SeguridadAuditoriaRepository {

    private final DataSource dataSource;

    public SeguridadAuditoriaRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // =====================================================================
    // RF-23 y RF-25: Roles y Usuarios (rol, usuario)
    // =====================================================================
    public List<Rol> listarRoles() throws SQLException {
        String sql = "SELECT id_rol, nombre FROM rol ORDER BY id_rol";
        List<Rol> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Rol(rs.getInt("id_rol"), rs.getString("nombre")));
            }
        }
        return lista;
    }

    public List<Usuario> listarUsuarios() throws SQLException {
        String sql = "SELECT u.id_usuario, u.nombre_usuario, u.activo, u.id_rol, r.nombre AS nombre_rol, " +
                     "       u.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente " +
                     "FROM usuario u " +
                     "JOIN rol r ON r.id_rol = u.id_rol " +
                     "LEFT JOIN docente d ON d.id_docente = u.id_docente " +
                     "ORDER BY u.id_usuario";
        List<Usuario> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapUsuario(rs));
            }
        }
        return lista;
    }

    public Usuario obtenerUsuarioPorId(int idUsuario) throws SQLException {
        String sql = "SELECT u.id_usuario, u.nombre_usuario, u.activo, u.id_rol, r.nombre AS nombre_rol, " +
                     "       u.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente " +
                     "FROM usuario u " +
                     "JOIN rol r ON r.id_rol = u.id_rol " +
                     "LEFT JOIN docente d ON d.id_docente = u.id_docente " +
                     "WHERE u.id_usuario = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUsuario(rs);
                }
            }
        }
        throw new NoSuchElementException("Usuario no encontrado: " + idUsuario);
    }

    public Usuario obtenerUsuarioConContrasenaPorNombre(String nombreUsuario) throws SQLException {
        String sql = "SELECT u.id_usuario, u.nombre_usuario, u.contrasena, u.activo, u.id_rol, r.nombre AS nombre_rol, " +
                     "       u.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente " +
                     "FROM usuario u " +
                     "JOIN rol r ON r.id_rol = u.id_rol " +
                     "LEFT JOIN docente d ON d.id_docente = u.id_docente " +
                     "WHERE LOWER(u.nombre_usuario) = LOWER(?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nombreUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Usuario u = mapUsuario(rs);
                    u.setContrasena(rs.getString("contrasena"));
                    return u;
                }
            }
        }
        return null;
    }

    public Usuario crearUsuario(Usuario u, String passwordHash) throws SQLException {
        String sql = "INSERT INTO usuario (nombre_usuario, contrasena, activo, id_rol, id_docente) " +
                     "VALUES (?, ?, COALESCE(?, true), ?, ?) RETURNING id_usuario";
        int idGenerado;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.getNombreUsuario());
            ps.setString(2, passwordHash);
            if (u.getActivo() != null) {
                ps.setBoolean(3, u.getActivo());
            } else {
                ps.setNull(3, Types.BOOLEAN);
            }
            ps.setInt(4, u.getIdRol());
            if (u.getIdDocente() != null) {
                ps.setInt(5, u.getIdDocente());
            } else {
                ps.setNull(5, Types.INTEGER);
            }
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    idGenerado = rs.getInt(1);
                } else {
                    throw new SQLException("No se pudo crear el usuario");
                }
            }
        }
        return obtenerUsuarioPorId(idGenerado);
    }

    public Usuario actualizarUsuario(int idUsuario, Usuario u, String passwordHash) throws SQLException {
        String sql = "UPDATE usuario " +
                     "SET nombre_usuario = COALESCE(?, nombre_usuario), " +
                     "    contrasena = COALESCE(?, contrasena), " +
                     "    activo = COALESCE(?, activo), " +
                     "    id_rol = COALESCE(?, id_rol), " +
                     "    id_docente = ? " +
                     "WHERE id_usuario = ?";
        Usuario actual = obtenerUsuarioPorId(idUsuario);
        Integer idDocenteFinal = u.getIdDocente() != null ? u.getIdDocente() : actual.getIdDocente();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.getNombreUsuario());
            ps.setString(2, passwordHash);
            if (u.getActivo() != null) {
                ps.setBoolean(3, u.getActivo());
            } else {
                ps.setNull(3, Types.BOOLEAN);
            }
            if (u.getIdRol() != null) {
                ps.setInt(4, u.getIdRol());
            } else {
                ps.setNull(4, Types.INTEGER);
            }
            if (idDocenteFinal != null) {
                ps.setInt(5, idDocenteFinal);
            } else {
                ps.setNull(5, Types.INTEGER);
            }
            ps.setInt(6, idUsuario);
            ps.executeUpdate();
        }
        return obtenerUsuarioPorId(idUsuario);
    }

    // =====================================================================
    // RF-24: Bitácora de Auditoría (log_auditoria)
    // =====================================================================
    public List<LogAuditoria> listarAuditoria(String tablaAfectada, String accion, Integer idUsuario) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT l.id_log, l.id_usuario, u.nombre_usuario, l.fecha_hora, " +
                "       l.accion, l.tabla_afectada, l.detalle::text AS detalle " +
                "FROM log_auditoria l " +
                "JOIN usuario u ON u.id_usuario = l.id_usuario " +
                "WHERE 1 = 1 ");
        List<Object> params = new ArrayList<>();
        if (tablaAfectada != null && !tablaAfectada.isBlank()) {
            sql.append("AND l.tabla_afectada = ? ");
            params.add(tablaAfectada);
        }
        if (accion != null && !accion.isBlank()) {
            sql.append("AND l.accion = ? ");
            params.add(accion);
        }
        if (idUsuario != null) {
            sql.append("AND l.id_usuario = ? ");
            params.add(idUsuario);
        }
        sql.append("ORDER BY l.fecha_hora DESC, l.id_log DESC");

        List<LogAuditoria> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OffsetDateTime fh = rs.getObject("fecha_hora", OffsetDateTime.class);
                    lista.add(new LogAuditoria(
                            rs.getLong("id_log"),
                            rs.getInt("id_usuario"),
                            rs.getString("nombre_usuario"),
                            fh,
                            rs.getString("accion"),
                            rs.getString("tabla_afectada"),
                            rs.getString("detalle")
                    ));
                }
            }
        }
        return lista;
    }

    private Usuario mapUsuario(ResultSet rs) throws SQLException {
        Integer idDocente = rs.getObject("id_docente") != null ? rs.getInt("id_docente") : null;
        return new Usuario(
                rs.getInt("id_usuario"),
                rs.getString("nombre_usuario"),
                null,
                rs.getBoolean("activo"),
                rs.getInt("id_rol"),
                rs.getString("nombre_rol"),
                idDocente,
                rs.getString("nombre_docente")
        );
    }
}
