package co.edu.unbosque.apihorarios.repository;

import co.edu.unbosque.apihorarios.model.CargaDocente;
import co.edu.unbosque.apihorarios.model.HorarioDetalle;
import co.edu.unbosque.apihorarios.model.SeccionRiesgoCierre;
import co.edu.unbosque.apihorarios.model.SeccionSesionesFaltantes;
import co.edu.unbosque.apihorarios.model.SesionDiasConsecutivos;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.util.ArrayList;
import java.util.List;

@Repository
public class ReporteRepository {

    private final DataSource dataSource;

    public ReporteRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // =====================================================================
    // RF-19: Consultar el horario de una versión por docente, espacio y sección (v_horario)
    // =====================================================================
    public List<HorarioDetalle> consultarHorario(Integer idVersion, Integer idDocente,
                                                 Integer idEspacio, Integer idSeccion,
                                                 Integer idPeriodo) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_asignacion, id_version, numero_version, estado_version, " +
                "       id_periodo, periodo, id_seccion, codigo_curso, nombre_curso, " +
                "       numero_seccion, id_docente, docente, id_espacio, codigo_espacio, " +
                "       tipo_espacio, id_franja, dia_semana, nombre_dia, hora_inicio, hora_fin " +
                "FROM v_horario WHERE 1 = 1 ");
        List<Object> params = new ArrayList<>();
        if (idVersion != null) {
            sql.append("AND id_version = ? ");
            params.add(idVersion);
        }
        if (idDocente != null) {
            sql.append("AND id_docente = ? ");
            params.add(idDocente);
        }
        if (idEspacio != null) {
            sql.append("AND id_espacio = ? ");
            params.add(idEspacio);
        }
        if (idSeccion != null) {
            sql.append("AND id_seccion = ? ");
            params.add(idSeccion);
        }
        if (idPeriodo != null) {
            sql.append("AND id_periodo = ? ");
            params.add(idPeriodo);
        }
        sql.append("ORDER BY dia_semana, hora_inicio, codigo_curso, numero_seccion");

        List<HorarioDetalle> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Time hi = rs.getTime("hora_inicio");
                    Time hf = rs.getTime("hora_fin");
                    lista.add(new HorarioDetalle(
                            rs.getInt("id_asignacion"),
                            rs.getInt("id_version"),
                            rs.getInt("numero_version"),
                            rs.getString("estado_version"),
                            rs.getInt("id_periodo"),
                            rs.getString("periodo"),
                            rs.getInt("id_seccion"),
                            rs.getString("codigo_curso"),
                            rs.getString("nombre_curso"),
                            rs.getInt("numero_seccion"),
                            rs.getInt("id_docente"),
                            rs.getString("docente"),
                            rs.getInt("id_espacio"),
                            rs.getString("codigo_espacio"),
                            rs.getString("tipo_espacio"),
                            rs.getInt("id_franja"),
                            rs.getInt("dia_semana"),
                            rs.getString("nombre_dia"),
                            hi != null ? hi.toLocalTime() : null,
                            hf != null ? hf.toLocalTime() : null
                    ));
                }
            }
        }
        return lista;
    }

    // =====================================================================
    // RF-20: Consultar carga horaria de cada docente frente a su contrato (v_carga_docente)
    // =====================================================================
    public List<CargaDocente> consultarCargaDocente(Integer idVersion, Integer idDocente,
                                                    String estadoCarga) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_version, id_periodo, id_docente, docente, tipo_contrato, " +
                "       sesiones, carga_asignada, horas_min, horas_max, estado_carga " +
                "FROM v_carga_docente WHERE 1 = 1 ");
        List<Object> params = new ArrayList<>();
        if (idVersion != null) {
            sql.append("AND id_version = ? ");
            params.add(idVersion);
        }
        if (idDocente != null) {
            sql.append("AND id_docente = ? ");
            params.add(idDocente);
        }
        if (estadoCarga != null && !estadoCarga.isBlank()) {
            sql.append("AND estado_carga = ? ");
            params.add(estadoCarga);
        }
        sql.append("ORDER BY id_version DESC, docente");

        List<CargaDocente> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new CargaDocente(
                            rs.getInt("id_version"),
                            rs.getInt("id_periodo"),
                            rs.getInt("id_docente"),
                            rs.getString("docente"),
                            rs.getString("tipo_contrato"),
                            rs.getLong("sesiones"),
                            rs.getLong("carga_asignada"),
                            rs.getInt("horas_min"),
                            rs.getInt("horas_max"),
                            rs.getString("estado_carga")
                    ));
                }
            }
        }
        return lista;
    }

    // =====================================================================
    // RF-21: Consultar secciones en riesgo de cierre (v_secciones_riesgo_cierre)
    // =====================================================================
    public List<SeccionRiesgoCierre> consultarSeccionesRiesgoCierre(String periodo) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_seccion, periodo, codigo_curso, nombre_curso, " +
                "       numero_seccion, matricula_real, cupo_min " +
                "FROM v_secciones_riesgo_cierre ");
        if (periodo != null && !periodo.isBlank()) {
            sql.append("WHERE periodo = ? ");
        }
        sql.append("ORDER BY periodo DESC, codigo_curso, numero_seccion");

        List<SeccionRiesgoCierre> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (periodo != null && !periodo.isBlank()) {
                ps.setString(1, periodo);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new SeccionRiesgoCierre(
                            rs.getInt("id_seccion"),
                            rs.getString("periodo"),
                            rs.getString("codigo_curso"),
                            rs.getString("nombre_curso"),
                            rs.getInt("numero_seccion"),
                            rs.getInt("matricula_real"),
                            rs.getInt("cupo_min")
                    ));
                }
            }
        }
        return lista;
    }

    // =====================================================================
    // RF-22 (Parte 1): Secciones con sesiones faltantes (v_secciones_sesiones_faltantes)
    // =====================================================================
    public List<SeccionSesionesFaltantes> consultarSeccionesSesionesFaltantes(Integer idVersion) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_version, id_seccion, codigo_curso, numero_seccion, " +
                "       frecuencia_semanal, sesiones_asignadas, sesiones_faltantes " +
                "FROM v_secciones_sesiones_faltantes ");
        if (idVersion != null) {
            sql.append("WHERE id_version = ? ");
        }
        sql.append("ORDER BY id_version DESC, codigo_curso, numero_seccion");

        List<SeccionSesionesFaltantes> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (idVersion != null) {
                ps.setInt(1, idVersion);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new SeccionSesionesFaltantes(
                            rs.getInt("id_version"),
                            rs.getInt("id_seccion"),
                            rs.getString("codigo_curso"),
                            rs.getInt("numero_seccion"),
                            rs.getInt("frecuencia_semanal"),
                            rs.getLong("sesiones_asignadas"),
                            rs.getLong("sesiones_faltantes")
                    ));
                }
            }
        }
        return lista;
    }

    // =====================================================================
    // RF-22 (Parte 2): Sesiones en días consecutivos (v_sesiones_dias_consecutivos)
    // =====================================================================
    public List<SesionDiasConsecutivos> consultarSesionesDiasConsecutivos(Integer idVersion) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id_version, id_seccion, codigo_curso, numero_seccion, dia_1, dia_2 " +
                "FROM v_sesiones_dias_consecutivos ");
        if (idVersion != null) {
            sql.append("WHERE id_version = ? ");
        }
        sql.append("ORDER BY id_version DESC, codigo_curso, numero_seccion");

        List<SesionDiasConsecutivos> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (idVersion != null) {
                ps.setInt(1, idVersion);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new SesionDiasConsecutivos(
                            rs.getInt("id_version"),
                            rs.getInt("id_seccion"),
                            rs.getString("codigo_curso"),
                            rs.getInt("numero_seccion"),
                            rs.getString("dia_1"),
                            rs.getString("dia_2")
                    ));
                }
            }
        }
        return lista;
    }
}
