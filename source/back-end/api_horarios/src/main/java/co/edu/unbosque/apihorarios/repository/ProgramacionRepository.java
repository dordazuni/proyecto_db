package co.edu.unbosque.apihorarios.repository;

import co.edu.unbosque.apihorarios.model.Asignacion;
import co.edu.unbosque.apihorarios.model.Usuario;
import co.edu.unbosque.apihorarios.model.VersionHorario;
import co.edu.unbosque.apihorarios.security.AuthContextHolder;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Repository
public class ProgramacionRepository {

    private final DataSource dataSource;

    public ProgramacionRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // =====================================================================
    // RF-12, RF-15, RF-16, RF-17, RF-18: Versiones de Horario (version_horario)
    // =====================================================================
    private boolean canReadUsuarioTable() {
        Usuario u = AuthContextHolder.getCurrentUser();
        if (u == null || u.getNombreRol() == null) {
            return true;
        }
        String rol = u.getNombreRol().trim().toUpperCase();
        return "ADMINISTRADOR".equals(rol) || "COORDINADOR".equals(rol);
    }

    public List<VersionHorario> listarVersiones(Integer idPeriodo) throws SQLException {
        StringBuilder sql;
        if (canReadUsuarioTable()) {
            sql = new StringBuilder(
                    "SELECT v.id_version, v.id_periodo, p.codigo AS codigo_periodo, v.numero_version, " +
                    "       v.estado, v.fecha_aval, v.id_documento_externo, v.id_usuario_aval, " +
                    "       u.nombre_usuario AS nombre_usuario_aval " +
                    "FROM version_horario v " +
                    "JOIN periodo_academico p ON p.id_periodo = v.id_periodo " +
                    "LEFT JOIN usuario u ON u.id_usuario = v.id_usuario_aval ");
        } else {
            sql = new StringBuilder(
                    "SELECT v.id_version, v.id_periodo, p.codigo AS codigo_periodo, v.numero_version, " +
                    "       v.estado, v.fecha_aval, v.id_documento_externo, v.id_usuario_aval, " +
                    "       NULL AS nombre_usuario_aval " +
                    "FROM version_horario v " +
                    "JOIN periodo_academico p ON p.id_periodo = v.id_periodo ");
        }
        if (idPeriodo != null) {
            sql.append("WHERE v.id_periodo = ? ");
        }
        sql.append("ORDER BY v.id_periodo DESC, v.numero_version DESC");

        List<VersionHorario> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (idPeriodo != null) {
                ps.setInt(1, idPeriodo);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapVersion(rs));
                }
            }
        }
        return lista;
    }

    public VersionHorario obtenerVersionPorId(int idVersion) throws SQLException {
        String sql;
        if (canReadUsuarioTable()) {
            sql = "SELECT v.id_version, v.id_periodo, p.codigo AS codigo_periodo, v.numero_version, " +
                  "       v.estado, v.fecha_aval, v.id_documento_externo, v.id_usuario_aval, " +
                  "       u.nombre_usuario AS nombre_usuario_aval " +
                  "FROM version_horario v " +
                  "JOIN periodo_academico p ON p.id_periodo = v.id_periodo " +
                  "LEFT JOIN usuario u ON u.id_usuario = v.id_usuario_aval " +
                  "WHERE v.id_version = ?";
        } else {
            sql = "SELECT v.id_version, v.id_periodo, p.codigo AS codigo_periodo, v.numero_version, " +
                  "       v.estado, v.fecha_aval, v.id_documento_externo, v.id_usuario_aval, " +
                  "       NULL AS nombre_usuario_aval " +
                  "FROM version_horario v " +
                  "JOIN periodo_academico p ON p.id_periodo = v.id_periodo " +
                  "WHERE v.id_version = ?";
        }
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idVersion);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapVersion(rs);
                }
            }
        }
        throw new NoSuchElementException("Versión de horario no encontrada: " + idVersion);
    }

    // RF-12: Crear versión de horario en estado EN_EDICION
    public VersionHorario crearVersion(VersionHorario v, int idUsuario) throws SQLException {
        String sqlNextNum = "SELECT COALESCE(MAX(numero_version), 0) + 1 FROM version_horario WHERE id_periodo = ?";
        String sqlInsert = "INSERT INTO version_horario (id_periodo, numero_version, estado) " +
                           "VALUES (?, ?, COALESCE(?, 'EN_EDICION')) RETURNING id_version";
        int idGenerado;
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                int numeroVersion = v.getNumeroVersion() != null ? v.getNumeroVersion() : 0;
                if (numeroVersion <= 0) {
                    try (PreparedStatement psNum = conn.prepareStatement(sqlNextNum)) {
                        psNum.setInt(1, v.getIdPeriodo());
                        try (ResultSet rsNum = psNum.executeQuery()) {
                            if (rsNum.next()) {
                                numeroVersion = rsNum.getInt(1);
                            } else {
                                numeroVersion = 1;
                            }
                        }
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement(sqlInsert)) {
                    ps.setInt(1, v.getIdPeriodo());
                    ps.setInt(2, numeroVersion);
                    ps.setString(3, v.getEstado());
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            idGenerado = rs.getInt(1);
                        } else {
                            throw new SQLException("No se pudo crear la versión de horario");
                        }
                    }
                }
                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return obtenerVersionPorId(idGenerado);
    }

    // RF-15 (EN_EDICION -> PENDIENTE), RF-16 (PENDIENTE -> AVALADO / EN_EDICION)
    public VersionHorario cambiarEstadoVersion(int idVersion, String nuevoEstado, int idUsuario) throws SQLException {
        String sql = "UPDATE version_horario SET estado = ? WHERE id_version = ?";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, nuevoEstado);
                    ps.setInt(2, idVersion);
                    int affected = ps.executeUpdate();
                    if (affected == 0) {
                        throw new NoSuchElementException("Versión de horario no encontrada: " + idVersion);
                    }
                }
                conn.commit();
            } catch (SQLException | NoSuchElementException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return obtenerVersionPorId(idVersion);
    }

    // RF-17: Registrar sincronización documental (AVALADO -> SINCRONIZADO)
    public VersionHorario sincronizarVersion(int idVersion, String idDocumentoExterno, int idUsuario) throws SQLException {
        String sql = "UPDATE version_horario SET estado = 'SINCRONIZADO', id_documento_externo = ? WHERE id_version = ?";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, idDocumentoExterno);
                    ps.setInt(2, idVersion);
                    int affected = ps.executeUpdate();
                    if (affected == 0) {
                        throw new NoSuchElementException("Versión de horario no encontrada: " + idVersion);
                    }
                }
                conn.commit();
            } catch (SQLException | NoSuchElementException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return obtenerVersionPorId(idVersion);
    }

    // RF-18: Crear una versión nueva EN_EDICION a partir de una versión existente/avalada
    public VersionHorario clonarVersion(int idVersionOrigen, int idUsuario) throws SQLException {
        String sqlOrigen = "SELECT id_periodo, estado FROM version_horario WHERE id_version = ?";
        String sqlNextNum = "SELECT COALESCE(MAX(numero_version), 0) + 1 FROM version_horario WHERE id_periodo = ?";
        String sqlInsertVersion = "INSERT INTO version_horario (id_periodo, numero_version, estado) " +
                                  "VALUES (?, ?, 'EN_EDICION') RETURNING id_version";
        String sqlCopyAsignaciones = "INSERT INTO asignacion (id_version, id_seccion, id_docente, id_espacio, id_franja) " +
                                     "SELECT ?, id_seccion, id_docente, id_espacio, id_franja " +
                                     "FROM asignacion WHERE id_version = ?";
        int idNuevaVersion;
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                int idPeriodo;
                try (PreparedStatement psOrig = conn.prepareStatement(sqlOrigen)) {
                    psOrig.setInt(1, idVersionOrigen);
                    try (ResultSet rsOrig = psOrig.executeQuery()) {
                        if (!rsOrig.next()) {
                            throw new NoSuchElementException("Versión origen no encontrada: " + idVersionOrigen);
                        }
                        idPeriodo = rsOrig.getInt("id_periodo");
                    }
                }

                int nuevoNumero = 1;
                try (PreparedStatement psNum = conn.prepareStatement(sqlNextNum)) {
                    psNum.setInt(1, idPeriodo);
                    try (ResultSet rsNum = psNum.executeQuery()) {
                        if (rsNum.next()) {
                            nuevoNumero = rsNum.getInt(1);
                        }
                    }
                }

                try (PreparedStatement psIns = conn.prepareStatement(sqlInsertVersion)) {
                    psIns.setInt(1, idPeriodo);
                    psIns.setInt(2, nuevoNumero);
                    try (ResultSet rsIns = psIns.executeQuery()) {
                        if (rsIns.next()) {
                            idNuevaVersion = rsIns.getInt(1);
                        } else {
                            throw new SQLException("No se pudo crear la versión clonada");
                        }
                    }
                }

                try (PreparedStatement psCopy = conn.prepareStatement(sqlCopyAsignaciones)) {
                    psCopy.setInt(1, idNuevaVersion);
                    psCopy.setInt(2, idVersionOrigen);
                    psCopy.executeUpdate();
                }

                conn.commit();
            } catch (SQLException | NoSuchElementException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return obtenerVersionPorId(idNuevaVersion);
    }

    // =====================================================================
    // RF-13 y RF-14: Asignación de Sesiones (asignacion)
    // =====================================================================
    public List<Asignacion> listarAsignaciones(Integer idVersion) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_asignacion, id_version, id_seccion, id_docente, id_espacio, " +
                "       id_franja, id_usuario_creador, fecha_creacion " +
                "FROM asignacion ");
        if (idVersion != null) {
            sql.append("WHERE id_version = ? ");
        }
        sql.append("ORDER BY id_version, id_franja, id_seccion");

        List<Asignacion> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (idVersion != null) {
                ps.setInt(1, idVersion);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapAsignacion(rs));
                }
            }
        }
        return lista;
    }

    public Asignacion obtenerAsignacionPorId(int idAsignacion) throws SQLException {
        String sql = "SELECT id_asignacion, id_version, id_seccion, id_docente, id_espacio, " +
                     "       id_franja, id_usuario_creador, fecha_creacion " +
                     "FROM asignacion WHERE id_asignacion = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idAsignacion);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapAsignacion(rs);
                }
            }
        }
        throw new NoSuchElementException("Asignación no encontrada: " + idAsignacion);
    }

    // RF-13: Crear asignación (la BD valida RN-01 a RN-16 y audita con RF-24)
    public Asignacion crearAsignacion(Asignacion a, int idUsuario) throws SQLException {
        String sql = "INSERT INTO asignacion (id_version, id_seccion, id_docente, id_espacio, id_franja) " +
                     "VALUES (?, ?, ?, ?, ?) " +
                     "RETURNING id_asignacion, id_version, id_seccion, id_docente, id_espacio, " +
                     "          id_franja, id_usuario_creador, fecha_creacion";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, a.getIdVersion());
                    ps.setInt(2, a.getIdSeccion());
                    ps.setInt(3, a.getIdDocente());
                    ps.setInt(4, a.getIdEspacio());
                    ps.setInt(5, a.getIdFranja());
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            Asignacion creada = mapAsignacion(rs);
                            conn.commit();
                            return creada;
                        }
                    }
                }
                throw new SQLException("No se pudo crear la asignación");
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    // RF-14: Modificar asignación mientras su versión esté EN_EDICION
    public Asignacion actualizarAsignacion(int idAsignacion, Asignacion a, int idUsuario) throws SQLException {
        String sql = "UPDATE asignacion " +
                     "SET id_seccion = COALESCE(?, id_seccion), " +
                     "    id_docente = COALESCE(?, id_docente), " +
                     "    id_espacio = COALESCE(?, id_espacio), " +
                     "    id_franja  = COALESCE(?, id_franja) " +
                     "WHERE id_asignacion = ? " +
                     "RETURNING id_asignacion, id_version, id_seccion, id_docente, id_espacio, " +
                     "          id_franja, id_usuario_creador, fecha_creacion";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    if (a.getIdSeccion() != null) {
                        ps.setInt(1, a.getIdSeccion());
                    } else {
                        ps.setNull(1, java.sql.Types.INTEGER);
                    }
                    if (a.getIdDocente() != null) {
                        ps.setInt(2, a.getIdDocente());
                    } else {
                        ps.setNull(2, java.sql.Types.INTEGER);
                    }
                    if (a.getIdEspacio() != null) {
                        ps.setInt(3, a.getIdEspacio());
                    } else {
                        ps.setNull(3, java.sql.Types.INTEGER);
                    }
                    if (a.getIdFranja() != null) {
                        ps.setInt(4, a.getIdFranja());
                    } else {
                        ps.setNull(4, java.sql.Types.SMALLINT);
                    }
                    ps.setInt(5, idAsignacion);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            Asignacion actualizada = mapAsignacion(rs);
                            conn.commit();
                            return actualizada;
                        }
                    }
                }
                throw new NoSuchElementException("Asignación no encontrada: " + idAsignacion);
            } catch (SQLException | NoSuchElementException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    // RF-14: Eliminar asignación mientras su versión esté EN_EDICION
    public void eliminarAsignacion(int idAsignacion, int idUsuario) throws SQLException {
        String sql = "DELETE FROM asignacion WHERE id_asignacion = ?";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                fijarUsuarioActual(conn, idUsuario);
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, idAsignacion);
                    int affected = ps.executeUpdate();
                    if (affected == 0) {
                        throw new NoSuchElementException("Asignación no encontrada: " + idAsignacion);
                    }
                }
                conn.commit();
            } catch (SQLException | NoSuchElementException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private void fijarUsuarioActual(Connection conn, int idUsuario) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT set_config('app.id_usuario', ?, true)")) {
            ps.setString(1, String.valueOf(idUsuario));
            ps.executeQuery();
        }
    }

    private VersionHorario mapVersion(ResultSet rs) throws SQLException {
        OffsetDateTime fechaAval = rs.getObject("fecha_aval", OffsetDateTime.class);
        Integer idUsuarioAval = rs.getObject("id_usuario_aval") != null ? rs.getInt("id_usuario_aval") : null;
        return new VersionHorario(
                rs.getInt("id_version"),
                rs.getInt("id_periodo"),
                rs.getString("codigo_periodo"),
                rs.getInt("numero_version"),
                rs.getString("estado"),
                fechaAval,
                rs.getString("id_documento_externo"),
                idUsuarioAval,
                rs.getString("nombre_usuario_aval")
        );
    }

    private Asignacion mapAsignacion(ResultSet rs) throws SQLException {
        OffsetDateTime fechaCreacion = rs.getObject("fecha_creacion", OffsetDateTime.class);
        return new Asignacion(
                rs.getInt("id_asignacion"),
                rs.getInt("id_version"),
                rs.getInt("id_seccion"),
                rs.getInt("id_docente"),
                rs.getInt("id_espacio"),
                rs.getInt("id_franja"),
                rs.getInt("id_usuario_creador"),
                fechaCreacion
        );
    }
}
