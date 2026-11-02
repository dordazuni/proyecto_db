package co.edu.unbosque.apihorarios.repository;

import co.edu.unbosque.apihorarios.model.Curso;
import co.edu.unbosque.apihorarios.model.CursoRecurso;
import co.edu.unbosque.apihorarios.model.Docente;
import co.edu.unbosque.apihorarios.model.DocenteCurso;
import co.edu.unbosque.apihorarios.model.Espacio;
import co.edu.unbosque.apihorarios.model.EspacioRecurso;
import co.edu.unbosque.apihorarios.model.Franja;
import co.edu.unbosque.apihorarios.model.ParametroSistema;
import co.edu.unbosque.apihorarios.model.PeriodoAcademico;
import co.edu.unbosque.apihorarios.model.Recurso;
import co.edu.unbosque.apihorarios.model.TipoContrato;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Repository
public class CatalogoRepository {

    private final DataSource dataSource;

    public CatalogoRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // =====================================================================
    // RF-01: Períodos Académicos (periodo_academico)
    // =====================================================================
    public List<PeriodoAcademico> listarPeriodos() throws SQLException {
        String sql = "SELECT id_periodo, codigo, fecha_inicio, fecha_fin, estado " +
                     "FROM periodo_academico ORDER BY codigo DESC";
        List<PeriodoAcademico> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapPeriodo(rs));
            }
        }
        return lista;
    }

    public PeriodoAcademico obtenerPeriodoPorId(int idPeriodo) throws SQLException {
        String sql = "SELECT id_periodo, codigo, fecha_inicio, fecha_fin, estado " +
                     "FROM periodo_academico WHERE id_periodo = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idPeriodo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPeriodo(rs);
                }
            }
        }
        throw new NoSuchElementException("Período académico no encontrado: " + idPeriodo);
    }

    public PeriodoAcademico crearPeriodo(PeriodoAcademico p) throws SQLException {
        String sql = "INSERT INTO periodo_academico (codigo, fecha_inicio, fecha_fin, estado) " +
                     "VALUES (?, ?, ?, COALESCE(?, 'PLANEACION')) " +
                     "RETURNING id_periodo, codigo, fecha_inicio, fecha_fin, estado";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getCodigo());
            ps.setDate(2, p.getFechaInicio() != null ? Date.valueOf(p.getFechaInicio()) : null);
            ps.setDate(3, p.getFechaFin() != null ? Date.valueOf(p.getFechaFin()) : null);
            ps.setString(4, p.getEstado());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPeriodo(rs);
                }
            }
        }
        throw new SQLException("No se pudo crear el período académico");
    }

    public PeriodoAcademico actualizarPeriodo(int idPeriodo, PeriodoAcademico p) throws SQLException {
        String sql = "UPDATE periodo_academico " +
                     "SET codigo = COALESCE(?, codigo), " +
                     "    fecha_inicio = COALESCE(?, fecha_inicio), " +
                     "    fecha_fin = COALESCE(?, fecha_fin), " +
                     "    estado = COALESCE(?, estado) " +
                     "WHERE id_periodo = ? " +
                     "RETURNING id_periodo, codigo, fecha_inicio, fecha_fin, estado";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getCodigo());
            ps.setDate(2, p.getFechaInicio() != null ? Date.valueOf(p.getFechaInicio()) : null);
            ps.setDate(3, p.getFechaFin() != null ? Date.valueOf(p.getFechaFin()) : null);
            ps.setString(4, p.getEstado());
            ps.setInt(5, idPeriodo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPeriodo(rs);
                }
            }
        }
        throw new NoSuchElementException("Período académico no encontrado: " + idPeriodo);
    }

    // =====================================================================
    // RF-02: Docentes y Tipos de Contrato (docente, tipo_contrato) - Solo lectura en app
    // =====================================================================
    public List<TipoContrato> listarTiposContrato() throws SQLException {
        String sql = "SELECT id_tipo_contrato, nombre, horas_min, horas_max " +
                     "FROM tipo_contrato ORDER BY id_tipo_contrato";
        List<TipoContrato> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new TipoContrato(
                        rs.getInt("id_tipo_contrato"),
                        rs.getString("nombre"),
                        rs.getInt("horas_min"),
                        rs.getInt("horas_max")
                ));
            }
        }
        return lista;
    }

    public List<Docente> listarDocentes() throws SQLException {
        String sql = "SELECT d.id_docente, d.tipo_documento, d.numero_documento, d.nombres, d.apellidos, " +
                     "       d.email, d.estado_vinculacion, d.id_tipo_contrato, " +
                     "       tc.nombre AS nombre_tipo_contrato, tc.horas_min, tc.horas_max " +
                     "FROM docente d " +
                     "JOIN tipo_contrato tc ON tc.id_tipo_contrato = d.id_tipo_contrato " +
                     "ORDER BY d.apellidos, d.nombres";
        List<Docente> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapDocente(rs));
            }
        }
        return lista;
    }

    public Docente obtenerDocentePorId(int idDocente) throws SQLException {
        String sql = "SELECT d.id_docente, d.tipo_documento, d.numero_documento, d.nombres, d.apellidos, " +
                     "       d.email, d.estado_vinculacion, d.id_tipo_contrato, " +
                     "       tc.nombre AS nombre_tipo_contrato, tc.horas_min, tc.horas_max " +
                     "FROM docente d " +
                     "JOIN tipo_contrato tc ON tc.id_tipo_contrato = d.id_tipo_contrato " +
                     "WHERE d.id_docente = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idDocente);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapDocente(rs);
                }
            }
        }
        throw new NoSuchElementException("Docente no encontrado: " + idDocente);
    }

    public Docente crearDocente(Docente d) throws SQLException {
        Integer idContrato = d.getIdTipoContrato();
        if (idContrato == null && d.getNombreTipoContrato() != null && !d.getNombreTipoContrato().isBlank()) {
            String sqlContrato = "SELECT id_tipo_contrato FROM tipo_contrato WHERE UPPER(nombre) = UPPER(?)";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sqlContrato)) {
                ps.setString(1, d.getNombreTipoContrato().trim());
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        idContrato = rs.getInt(1);
                    }
                }
            }
        }
        if (idContrato == null) {
            idContrato = 1;
        }

        String sql = "INSERT INTO docente (tipo_documento, numero_documento, nombres, apellidos, email, estado_vinculacion, id_tipo_contrato) " +
                     "VALUES (?, ?, ?, ?, ?, COALESCE(?, 'ACTIVO'), ?) RETURNING id_docente";
        int idGenerado;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, d.getTipoDocumento() != null && !d.getTipoDocumento().isBlank() ? d.getTipoDocumento().trim() : "CC");
            ps.setString(2, d.getNumeroDocumento().trim());
            ps.setString(3, d.getNombres().trim());
            ps.setString(4, d.getApellidos().trim());
            ps.setString(5, d.getEmail().toLowerCase().trim());
            ps.setString(6, d.getEstadoVinculacion() != null && !d.getEstadoVinculacion().isBlank() ? d.getEstadoVinculacion().trim() : "ACTIVO");
            ps.setInt(7, idContrato);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    idGenerado = rs.getInt(1);
                } else {
                    throw new SQLException("No se pudo insertar el docente");
                }
            }
        }
        return obtenerDocentePorId(idGenerado);
    }

    // =====================================================================
    // RF-03: Espacios (espacio, laboratorio_computo, laboratorio_especializado)
    // =====================================================================
    public List<Espacio> listarEspacios() throws SQLException {
        String sql = "SELECT e.id_espacio, e.codigo, e.nombre, e.capacidad, e.edificio, e.tipo_espacio, " +
                     "       lc.numero_equipos, le.area " +
                     "FROM espacio e " +
                     "LEFT JOIN laboratorio_computo lc ON lc.id_espacio = e.id_espacio " +
                     "LEFT JOIN laboratorio_especializado le ON le.id_espacio = e.id_espacio " +
                     "ORDER BY e.codigo";
        List<Espacio> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapEspacio(rs));
            }
        }
        return lista;
    }

    public Espacio obtenerEspacioPorId(int idEspacio) throws SQLException {
        String sql = "SELECT e.id_espacio, e.codigo, e.nombre, e.capacidad, e.edificio, e.tipo_espacio, " +
                     "       lc.numero_equipos, le.area " +
                     "FROM espacio e " +
                     "LEFT JOIN laboratorio_computo lc ON lc.id_espacio = e.id_espacio " +
                     "LEFT JOIN laboratorio_especializado le ON le.id_espacio = e.id_espacio " +
                     "WHERE e.id_espacio = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idEspacio);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapEspacio(rs);
                }
            }
        }
        throw new NoSuchElementException("Espacio no encontrado: " + idEspacio);
    }

    public Espacio crearEspacio(Espacio e) throws SQLException {
        String sql = "INSERT INTO espacio (codigo, nombre, capacidad, edificio, tipo_espacio) " +
                     "VALUES (?, ?, ?, ?, ?) RETURNING id_espacio";
        int idGenerado;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.getCodigo().trim());
            ps.setString(2, e.getNombre().trim());
            ps.setInt(3, e.getCapacidad() != null ? e.getCapacidad() : 30);
            ps.setString(4, e.getEdificio() != null && !e.getEdificio().isBlank() ? e.getEdificio().trim() : "Principal");
            ps.setString(5, e.getTipoEspacio() != null && !e.getTipoEspacio().isBlank() ? e.getTipoEspacio().trim() : "AULA");
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    idGenerado = rs.getInt(1);
                } else {
                    throw new SQLException("No se pudo insertar el espacio");
                }
            }
        }

        if ("LABORATORIO_COMPUTO".equalsIgnoreCase(e.getTipoEspacio()) && e.getNumeroEquipos() != null) {
            String sqlLc = "INSERT INTO laboratorio_computo (id_espacio, numero_equipos) VALUES (?, ?)";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sqlLc)) {
                ps.setInt(1, idGenerado);
                ps.setInt(2, e.getNumeroEquipos());
                ps.executeUpdate();
            }
        } else if ("LABORATORIO_ESPECIALIZADO".equalsIgnoreCase(e.getTipoEspacio()) && e.getArea() != null) {
            String sqlLe = "INSERT INTO laboratorio_especializado (id_espacio, area) VALUES (?, ?)";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sqlLe)) {
                ps.setInt(1, idGenerado);
                ps.setString(2, e.getArea());
                ps.executeUpdate();
            }
        }

        return obtenerEspacioPorId(idGenerado);
    }

    // =====================================================================
    // RF-04: Recursos y Dotación de Espacios (recurso, espacio_recurso)
    // =====================================================================
    public List<Recurso> listarRecursos() throws SQLException {
        String sql = "SELECT id_recurso, nombre, categoria FROM recurso ORDER BY id_recurso";
        List<Recurso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Recurso(rs.getInt("id_recurso"), rs.getString("nombre"), rs.getString("categoria")));
            }
        }
        return lista;
    }

    public Recurso crearRecurso(Recurso r) throws SQLException {
        String sql = "INSERT INTO recurso (nombre, categoria) VALUES (?, ?) " +
                     "RETURNING id_recurso, nombre, categoria";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getNombre());
            ps.setString(2, r.getCategoria());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Recurso(rs.getInt("id_recurso"), rs.getString("nombre"), rs.getString("categoria"));
                }
            }
        }
        throw new SQLException("No se pudo crear el recurso");
    }

    public Recurso actualizarRecurso(int idRecurso, Recurso r) throws SQLException {
        String sql = "UPDATE recurso SET nombre = COALESCE(?, nombre), categoria = COALESCE(?, categoria) " +
                     "WHERE id_recurso = ? RETURNING id_recurso, nombre, categoria";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getNombre());
            ps.setString(2, r.getCategoria());
            ps.setInt(3, idRecurso);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Recurso(rs.getInt("id_recurso"), rs.getString("nombre"), rs.getString("categoria"));
                }
            }
        }
        throw new NoSuchElementException("Recurso no encontrado: " + idRecurso);
    }

    public List<EspacioRecurso> listarRecursosPorEspacio(int idEspacio) throws SQLException {
        String sql = "SELECT er.id_espacio, er.id_recurso, r.nombre AS nombre_recurso, " +
                     "       r.categoria AS categoria_recurso, er.cantidad " +
                     "FROM espacio_recurso er " +
                     "JOIN recurso r ON r.id_recurso = er.id_recurso " +
                     "WHERE er.id_espacio = ? ORDER BY r.nombre";
        List<EspacioRecurso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idEspacio);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new EspacioRecurso(
                            rs.getInt("id_espacio"),
                            rs.getInt("id_recurso"),
                            rs.getString("nombre_recurso"),
                            rs.getString("categoria_recurso"),
                            rs.getInt("cantidad")
                    ));
                }
            }
        }
        return lista;
    }

    public EspacioRecurso asignarRecursoAEspacio(int idEspacio, int idRecurso, int cantidad) throws SQLException {
        String sql = "INSERT INTO espacio_recurso (id_espacio, id_recurso, cantidad) VALUES (?, ?, ?) " +
                     "ON CONFLICT (id_espacio, id_recurso) DO UPDATE SET cantidad = EXCLUDED.cantidad";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idEspacio);
            ps.setInt(2, idRecurso);
            ps.setInt(3, cantidad);
            ps.executeUpdate();
        }
        return new EspacioRecurso(idEspacio, idRecurso, null, null, cantidad);
    }

    public void eliminarRecursoDeEspacio(int idEspacio, int idRecurso) throws SQLException {
        String sql = "DELETE FROM espacio_recurso WHERE id_espacio = ? AND id_recurso = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idEspacio);
            ps.setInt(2, idRecurso);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("El espacio no tiene asignado ese recurso");
            }
        }
    }

    // =====================================================================
    // RF-05: Cursos y Recursos Requeridos (curso, v_curso, curso_recurso)
    // =====================================================================
    public List<Curso> listarCursos() throws SQLException {
        String sql = "SELECT id_curso, codigo, nombre, frecuencia_semanal, horas_semanales " +
                     "FROM v_curso ORDER BY codigo";
        List<Curso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapCurso(rs));
            }
        }
        return lista;
    }

    public Curso obtenerCursoPorId(int idCurso) throws SQLException {
        String sql = "SELECT id_curso, codigo, nombre, frecuencia_semanal, horas_semanales " +
                     "FROM v_curso WHERE id_curso = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCurso(rs);
                }
            }
        }
        throw new NoSuchElementException("Curso no encontrado: " + idCurso);
    }

    public Curso crearCurso(Curso c) throws SQLException {
        String sql = "INSERT INTO curso (codigo, nombre, frecuencia_semanal) VALUES (?, ?, ?) " +
                     "RETURNING id_curso, codigo, nombre, frecuencia_semanal, (frecuencia_semanal * 2) AS horas_semanales";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getCodigo());
            ps.setString(2, c.getNombre());
            ps.setInt(3, c.getFrecuenciaSemanal() != null ? c.getFrecuenciaSemanal() : 1);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCurso(rs);
                }
            }
        }
        throw new SQLException("No se pudo crear el curso");
    }

    public Curso actualizarCurso(int idCurso, Curso c) throws SQLException {
        String sql = "UPDATE curso " +
                     "SET codigo = COALESCE(?, codigo), " +
                     "    nombre = COALESCE(?, nombre), " +
                     "    frecuencia_semanal = COALESCE(?, frecuencia_semanal) " +
                     "WHERE id_curso = ? " +
                     "RETURNING id_curso, codigo, nombre, frecuencia_semanal, (frecuencia_semanal * 2) AS horas_semanales";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getCodigo());
            ps.setString(2, c.getNombre());
            if (c.getFrecuenciaSemanal() != null) {
                ps.setInt(3, c.getFrecuenciaSemanal());
            } else {
                ps.setNull(3, java.sql.Types.SMALLINT);
            }
            ps.setInt(4, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCurso(rs);
                }
            }
        }
        throw new NoSuchElementException("Curso no encontrado: " + idCurso);
    }

    public List<CursoRecurso> listarRecursosDeCurso(int idCurso) throws SQLException {
        String sql = "SELECT cr.id_curso, cr.id_recurso, r.nombre AS nombre_recurso, r.categoria AS categoria_recurso " +
                     "FROM curso_recurso cr " +
                     "JOIN recurso r ON r.id_recurso = cr.id_recurso " +
                     "WHERE cr.id_curso = ? ORDER BY r.nombre";
        List<CursoRecurso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new CursoRecurso(
                            rs.getInt("id_curso"),
                            rs.getInt("id_recurso"),
                            rs.getString("nombre_recurso"),
                            rs.getString("categoria_recurso")
                    ));
                }
            }
        }
        return lista;
    }

    public CursoRecurso agregarRecursoACurso(int idCurso, int idRecurso) throws SQLException {
        String sql = "INSERT INTO curso_recurso (id_curso, id_recurso) VALUES (?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idCurso);
            ps.setInt(2, idRecurso);
            ps.executeUpdate();
        }
        return new CursoRecurso(idCurso, idRecurso, null, null);
    }

    public void eliminarRecursoDeCurso(int idCurso, int idRecurso) throws SQLException {
        String sql = "DELETE FROM curso_recurso WHERE id_curso = ? AND id_recurso = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idCurso);
            ps.setInt(2, idRecurso);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("El curso no tiene registrado ese recurso");
            }
        }
    }

    // =====================================================================
    // RF-06: Habilitación de Docentes por Curso (docente_curso)
    // =====================================================================
    public List<DocenteCurso> listarCursosPorDocente(int idDocente) throws SQLException {
        String sql = "SELECT dc.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente, " +
                     "       dc.id_curso, c.codigo AS codigo_curso, c.nombre AS nombre_curso " +
                     "FROM docente_curso dc " +
                     "JOIN docente d ON d.id_docente = dc.id_docente " +
                     "JOIN curso c ON c.id_curso = dc.id_curso " +
                     "WHERE dc.id_docente = ? ORDER BY c.codigo";
        List<DocenteCurso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idDocente);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new DocenteCurso(
                            rs.getInt("id_docente"),
                            rs.getString("nombre_docente"),
                            rs.getInt("id_curso"),
                            rs.getString("codigo_curso"),
                            rs.getString("nombre_curso")
                    ));
                }
            }
        }
        return lista;
    }

    public List<DocenteCurso> listarDocentesPorCurso(int idCurso) throws SQLException {
        String sql = "SELECT dc.id_docente, d.nombres || ' ' || d.apellidos AS nombre_docente, " +
                     "       dc.id_curso, c.codigo AS codigo_curso, c.nombre AS nombre_curso " +
                     "FROM docente_curso dc " +
                     "JOIN docente d ON d.id_docente = dc.id_docente " +
                     "JOIN curso c ON c.id_curso = dc.id_curso " +
                     "WHERE dc.id_curso = ? ORDER BY d.apellidos, d.nombres";
        List<DocenteCurso> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new DocenteCurso(
                            rs.getInt("id_docente"),
                            rs.getString("nombre_docente"),
                            rs.getInt("id_curso"),
                            rs.getString("codigo_curso"),
                            rs.getString("nombre_curso")
                    ));
                }
            }
        }
        return lista;
    }

    public DocenteCurso habilitarDocenteEnCurso(int idDocente, int idCurso) throws SQLException {
        String sql = "INSERT INTO docente_curso (id_docente, id_curso) VALUES (?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idDocente);
            ps.setInt(2, idCurso);
            ps.executeUpdate();
        }
        return new DocenteCurso(idDocente, null, idCurso, null, null);
    }

    public void deshabilitarDocenteEnCurso(int idDocente, int idCurso) throws SQLException {
        String sql = "DELETE FROM docente_curso WHERE id_docente = ? AND id_curso = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idDocente);
            ps.setInt(2, idCurso);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("El docente no estaba habilitado en ese curso");
            }
        }
    }

    // =====================================================================
    // RF-07: Catálogo de Franjas Horarias (franja, v_franja)
    // =====================================================================
    public List<Franja> listarFranjas() throws SQLException {
        String sql = "SELECT id_franja, dia_semana, nombre_dia, hora_inicio, hora_fin " +
                     "FROM v_franja ORDER BY id_franja";
        List<Franja> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(mapFranja(rs));
            }
        }
        return lista;
    }

    public Franja crearFranja(Franja f) throws SQLException {
        String sql = "INSERT INTO franja (id_franja, dia_semana, hora_inicio) VALUES (?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, f.getIdFranja());
            ps.setInt(2, f.getDiaSemana());
            ps.setTime(3, Time.valueOf(f.getHoraInicio()));
            ps.executeUpdate();
        }
        return obtenerFranjaPorId(f.getIdFranja());
    }

    public Franja actualizarFranja(int idFranja, Franja f) throws SQLException {
        String sql = "UPDATE franja SET dia_semana = COALESCE(?, dia_semana), " +
                     "                  hora_inicio = COALESCE(?, hora_inicio) " +
                     "WHERE id_franja = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (f.getDiaSemana() != null) {
                ps.setInt(1, f.getDiaSemana());
            } else {
                ps.setNull(1, java.sql.Types.SMALLINT);
            }
            if (f.getHoraInicio() != null) {
                ps.setTime(2, Time.valueOf(f.getHoraInicio()));
            } else {
                ps.setNull(2, java.sql.Types.TIME);
            }
            ps.setInt(3, idFranja);
            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new NoSuchElementException("Franja no encontrada: " + idFranja);
            }
        }
        return obtenerFranjaPorId(idFranja);
    }

    public Franja obtenerFranjaPorId(int idFranja) throws SQLException {
        String sql = "SELECT id_franja, dia_semana, nombre_dia, hora_inicio, hora_fin " +
                     "FROM v_franja WHERE id_franja = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idFranja);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapFranja(rs);
                }
            }
        }
        throw new NoSuchElementException("Franja no encontrada: " + idFranja);
    }

    // =====================================================================
    // RF-08: Parámetros del Sistema (parametro_sistema)
    // =====================================================================
    public List<ParametroSistema> listarParametros() throws SQLException {
        String sql = "SELECT clave, valor, descripcion FROM parametro_sistema ORDER BY clave";
        List<ParametroSistema> lista = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new ParametroSistema(
                        rs.getString("clave"),
                        rs.getBigDecimal("valor"),
                        rs.getString("descripcion")
                ));
            }
        }
        return lista;
    }

    public ParametroSistema actualizarParametro(String clave, ParametroSistema p) throws SQLException {
        String sql = "UPDATE parametro_sistema " +
                     "SET valor = COALESCE(?, valor), " +
                     "    descripcion = COALESCE(?, descripcion) " +
                     "WHERE clave = ? " +
                     "RETURNING clave, valor, descripcion";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, p.getValor());
            ps.setString(2, p.getDescripcion());
            ps.setString(3, clave);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new ParametroSistema(
                            rs.getString("clave"),
                            rs.getBigDecimal("valor"),
                            rs.getString("descripcion")
                    );
                }
            }
        }
        throw new NoSuchElementException("Parámetro del sistema no encontrado: " + clave);
    }

    // =====================================================================
    // Mappers internos
    // =====================================================================
    private PeriodoAcademico mapPeriodo(ResultSet rs) throws SQLException {
        Date fi = rs.getDate("fecha_inicio");
        Date ff = rs.getDate("fecha_fin");
        return new PeriodoAcademico(
                rs.getInt("id_periodo"),
                rs.getString("codigo"),
                fi != null ? fi.toLocalDate() : null,
                ff != null ? ff.toLocalDate() : null,
                rs.getString("estado")
        );
    }

    private Docente mapDocente(ResultSet rs) throws SQLException {
        return new Docente(
                rs.getInt("id_docente"),
                rs.getString("tipo_documento"),
                rs.getString("numero_documento"),
                rs.getString("nombres"),
                rs.getString("apellidos"),
                rs.getString("email"),
                rs.getString("estado_vinculacion"),
                rs.getInt("id_tipo_contrato"),
                rs.getString("nombre_tipo_contrato"),
                rs.getInt("horas_min"),
                rs.getInt("horas_max")
        );
    }

    private Espacio mapEspacio(ResultSet rs) throws SQLException {
        Integer equipos = rs.getObject("numero_equipos") != null ? rs.getInt("numero_equipos") : null;
        return new Espacio(
                rs.getInt("id_espacio"),
                rs.getString("codigo"),
                rs.getString("nombre"),
                rs.getInt("capacidad"),
                rs.getString("edificio"),
                rs.getString("tipo_espacio"),
                equipos,
                rs.getString("area")
        );
    }

    private Curso mapCurso(ResultSet rs) throws SQLException {
        return new Curso(
                rs.getInt("id_curso"),
                rs.getString("codigo"),
                rs.getString("nombre"),
                rs.getInt("frecuencia_semanal"),
                rs.getInt("horas_semanales")
        );
    }

    private Franja mapFranja(ResultSet rs) throws SQLException {
        Time hi = rs.getTime("hora_inicio");
        Time hf = rs.getTime("hora_fin");
        return new Franja(
                rs.getInt("id_franja"),
                rs.getInt("dia_semana"),
                rs.getString("nombre_dia"),
                hi != null ? hi.toLocalTime() : null,
                hf != null ? hf.toLocalTime() : null
        );
    }
}
