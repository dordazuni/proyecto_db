package co.edu.unbosque.apihorarios.repository;

import co.edu.unbosque.apihorarios.model.Disponibilidad;
import co.edu.unbosque.apihorarios.model.Seccion;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Repository
public class PlaneacionRepository {

    private final DataSource dataSource;

    public PlaneacionRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // =====================================================================
    // RF-09 y RF-10: Secciones (seccion)
    // =====================================================================
    public List<Seccion> listarSecciones(Integer idPeriodo, Integer idCurso) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT s.id_seccion, s.id_curso, c.codigo AS codigo_curso, c.nombre AS nombre_curso, " +
                "       s.id_periodo, p.codigo AS codigo_periodo, s.numero, s.cupo_max, s.cupo_min, " +
                "       s.matricula_proyectada, s.matricula_real, s.justificacion_sobrecupo, s.estado " +
                "FROM seccion s " +
                "JOIN curso c ON c.id_curso = s.id_curso " +
                "JOIN periodo_academico p ON p.id_periodo = s.id_periodo " +
                "WHERE 1 = 1 ");
        if (idPeriodo != null) {
            sql.append("AND s.id_periodo = ? ");
        }
        if (idCurso != null) {
            sql.append("AND s.id_curso = ? ");
        }
        sql.append("ORDER BY p.codigo DESC, c.codigo, s.numero");

        List<Seccion> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            int idx = 1;
            if (idPeriodo != null) {
                ps.setInt(idx++, idPeriodo);
            }
            if (idCurso != null) {
                ps.setInt(idx, idCurso);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapSeccion(rs));
                }
            }
        }
        return lista;
    }

    public Seccion obtenerSeccionPorId(int idSeccion) throws SQLException {
        String sql = "SELECT s.id_seccion, s.id_curso, c.codigo AS codigo_curso, c.nombre AS nombre_curso, " +
                     "       s.id_periodo, p.codigo AS codigo_periodo, s.numero, s.cupo_max, s.cupo_min, " +
                     "       s.matricula_proyectada, s.matricula_real, s.justificacion_sobrecupo, s.estado " +
                     "FROM seccion s " +
                     "JOIN curso c ON c.id_curso = s.id_curso " +
                     "JOIN periodo_academico p ON p.id_periodo = s.id_periodo " +
                     "WHERE s.id_seccion = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idSeccion);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapSeccion(rs);
                }
            }
        }
        throw new NoSuchElementException("Sección no encontrada: " + idSeccion);
    }

    public Seccion crearSeccion(Seccion s) throws SQLException {
        String sql = "INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max, cupo_min, " +
                     "                     matricula_proyectada, matricula_real, justificacion_sobrecupo, estado) " +
                     "VALUES (?, ?, ?, ?, ?, COALESCE(?, 0), ?, ?, COALESCE(?, 'ABIERTA')) " +
                     "RETURNING id_seccion";
        int idGenerado;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, s.getIdCurso());
            ps.setInt(2, s.getIdPeriodo());
            ps.setInt(3, s.getNumero());
            ps.setInt(4, s.getCupoMax());
            if (s.getCupoMin() != null) {
                ps.setInt(5, s.getCupoMin());
            } else {
                ps.setNull(5, Types.SMALLINT);
            }
            if (s.getMatriculaProyectada() != null) {
                ps.setInt(6, s.getMatriculaProyectada());
            } else {
                ps.setNull(6, Types.SMALLINT);
            }
            if (s.getMatriculaReal() != null) {
                ps.setInt(7, s.getMatriculaReal());
            } else {
                ps.setNull(7, Types.SMALLINT);
            }
            ps.setString(8, s.getJustificacionSobrecupo());
            ps.setString(9, s.getEstado());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    idGenerado = rs.getInt(1);
                } else {
                    throw new SQLException("No se pudo abrir la sección");
                }
            }
        }
        return obtenerSeccionPorId(idGenerado);
    }

    public Seccion actualizarSeccion(int idSeccion, Seccion s) throws SQLException {
        String sql = "UPDATE seccion " +
                     "SET cupo_max = COALESCE(?, cupo_max), " +
                     "    cupo_min = COALESCE(?, cupo_min), " +
                     "    matricula_proyectada = COALESCE(?, matricula_proyectada), " +
                     "    matricula_real = COALESCE(?, matricula_real), " +
                     "    justificacion_sobrecupo = COALESCE(?, justificacion_sobrecupo), " +
                     "    estado = COALESCE(?, estado) " +
                     "WHERE id_seccion = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableSmallInt(ps, 1, s.getCupoMax());
            setNullableSmallInt(ps, 2, s.getCupoMin());
            setNullableSmallInt(ps, 3, s.getMatriculaProyectada());
            setNullableSmallInt(ps, 4, s.getMatriculaReal());
            ps.setString(5, s.getJustificacionSobrecupo());
            ps.setString(6, s.getEstado());
            ps.setInt(7, idSeccion);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("Sección no encontrada: " + idSeccion);
            }
        }
        return obtenerSeccionPorId(idSeccion);
    }

    public Seccion registrarMatriculaReal(int idSeccion, int matriculaReal) throws SQLException {
        String sql = "UPDATE seccion SET matricula_real = ? WHERE id_seccion = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matriculaReal);
            ps.setInt(2, idSeccion);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("Sección no encontrada: " + idSeccion);
            }
        }
        return obtenerSeccionPorId(idSeccion);
    }

    public Seccion cambiarEstadoSeccion(int idSeccion, String estado) throws SQLException {
        String sql = "UPDATE seccion SET estado = ? WHERE id_seccion = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, estado);
            ps.setInt(2, idSeccion);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("Sección no encontrada: " + idSeccion);
            }
        }
        return obtenerSeccionPorId(idSeccion);
    }

    // =====================================================================
    // RF-11: Disponibilidad de Docentes (disponibilidad)
    // =====================================================================
    public List<Disponibilidad> listarDisponibilidad(Integer idDocente, Integer idPeriodo) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT disp.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente, " +
                "       disp.id_periodo, disp.id_franja, vf.dia_semana, vf.nombre_dia, " +
                "       vf.hora_inicio, vf.hora_fin, disp.tipo " +
                "FROM disponibilidad disp " +
                "JOIN docente d ON d.id_docente = disp.id_docente " +
                "JOIN v_franja vf ON vf.id_franja = disp.id_franja " +
                "WHERE 1 = 1 ");
        if (idDocente != null) {
            sql.append("AND disp.id_docente = ? ");
        }
        if (idPeriodo != null) {
            sql.append("AND disp.id_periodo = ? ");
        }
        sql.append("ORDER BY disp.id_docente, disp.id_periodo, disp.id_franja");

        List<Disponibilidad> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            int idx = 1;
            if (idDocente != null) {
                ps.setInt(idx++, idDocente);
            }
            if (idPeriodo != null) {
                ps.setInt(idx, idPeriodo);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Time hi = rs.getTime("hora_inicio");
                    Time hf = rs.getTime("hora_fin");
                    lista.add(new Disponibilidad(
                            rs.getInt("id_docente"),
                            rs.getString("nombre_docente"),
                            rs.getInt("id_periodo"),
                            rs.getInt("id_franja"),
                            rs.getInt("dia_semana"),
                            rs.getString("nombre_dia"),
                            hi != null ? hi.toLocalTime() : null,
                            hf != null ? hf.toLocalTime() : null,
                            rs.getString("tipo")
                    ));
                }
            }
        }
        return lista;
    }

    public Disponibilidad registrarDisponibilidad(Disponibilidad d, int idUsuario) throws SQLException {
        String sqlSetUser = "SELECT set_config('app.id_usuario', ?, true)";
        String sqlUpsert = "INSERT INTO disponibilidad (id_docente, id_periodo, id_franja, tipo) " +
                           "VALUES (?, ?, ?, COALESCE(?, 'NO_DISPONIBLE')) " +
                           "ON CONFLICT (id_docente, id_periodo, id_franja) " +
                           "DO UPDATE SET tipo = EXCLUDED.tipo";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement psUser = conn.prepareStatement(sqlSetUser)) {
                    psUser.setString(1, String.valueOf(idUsuario));
                    psUser.executeQuery();
                }
                try (PreparedStatement ps = conn.prepareStatement(sqlUpsert)) {
                    ps.setInt(1, d.getIdDocente());
                    ps.setInt(2, d.getIdPeriodo());
                    ps.setInt(3, d.getIdFranja());
                    ps.setString(4, d.getTipo());
                    ps.executeUpdate();
                }
                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return d;
    }

    public void eliminarDisponibilidad(int idDocente, int idPeriodo, int idFranja, int idUsuario) throws SQLException {
        String sqlSetUser = "SELECT set_config('app.id_usuario', ?, true)";
        String sqlDelete = "DELETE FROM disponibilidad WHERE id_docente = ? AND id_periodo = ? AND id_franja = ?";
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement psUser = conn.prepareStatement(sqlSetUser)) {
                    psUser.setString(1, String.valueOf(idUsuario));
                    psUser.executeQuery();
                }
                try (PreparedStatement ps = conn.prepareStatement(sqlDelete)) {
                    ps.setInt(1, idDocente);
                    ps.setInt(2, idPeriodo);
                    ps.setInt(3, idFranja);
                    int affected = ps.executeUpdate();
                    if (affected == 0) {
                        throw new NoSuchElementException("No se encontró registro de disponibilidad para esa franja");
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

    private void setNullableSmallInt(PreparedStatement ps, int index, Integer value) throws SQLException {
        if (value != null) {
            ps.setInt(index, value);
        } else {
            ps.setNull(index, Types.SMALLINT);
        }
    }

    private Seccion mapSeccion(ResultSet rs) throws SQLException {
        Integer matReal = rs.getObject("matricula_real") != null ? rs.getInt("matricula_real") : null;
        return new Seccion(
                rs.getInt("id_seccion"),
                rs.getInt("id_curso"),
                rs.getString("codigo_curso"),
                rs.getString("nombre_curso"),
                rs.getInt("id_periodo"),
                rs.getString("codigo_periodo"),
                rs.getInt("numero"),
                rs.getInt("cupo_max"),
                rs.getInt("cupo_min"),
                rs.getInt("matricula_proyectada"),
                matReal,
                rs.getString("justificacion_sobrecupo"),
                rs.getString("estado")
        );
    }
}
