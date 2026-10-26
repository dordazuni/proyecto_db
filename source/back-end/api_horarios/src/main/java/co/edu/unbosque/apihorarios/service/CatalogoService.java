package co.edu.unbosque.apihorarios.service;

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
import co.edu.unbosque.apihorarios.repository.CatalogoRepository;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class CatalogoService {

    private final CatalogoRepository catalogoRepository;

    public CatalogoService(CatalogoRepository catalogoRepository) {
        this.catalogoRepository = catalogoRepository;
    }

    // RF-01: Períodos Académicos
    public List<PeriodoAcademico> listarPeriodos() throws SQLException {
        return catalogoRepository.listarPeriodos();
    }

    public PeriodoAcademico obtenerPeriodoPorId(int idPeriodo) throws SQLException {
        return catalogoRepository.obtenerPeriodoPorId(idPeriodo);
    }

    public PeriodoAcademico crearPeriodo(PeriodoAcademico periodo) throws SQLException {
        return catalogoRepository.crearPeriodo(periodo);
    }

    public PeriodoAcademico actualizarPeriodo(int idPeriodo, PeriodoAcademico periodo) throws SQLException {
        return catalogoRepository.actualizarPeriodo(idPeriodo, periodo);
    }

    // RF-02: Tipos de Contrato y Docentes
    public List<TipoContrato> listarTiposContrato() throws SQLException {
        return catalogoRepository.listarTiposContrato();
    }

    public List<Docente> listarDocentes() throws SQLException {
        return catalogoRepository.listarDocentes();
    }

    public Docente obtenerDocentePorId(int idDocente) throws SQLException {
        return catalogoRepository.obtenerDocentePorId(idDocente);
    }

    // RF-03: Espacios
    public List<Espacio> listarEspacios() throws SQLException {
        return catalogoRepository.listarEspacios();
    }

    public Espacio obtenerEspacioPorId(int idEspacio) throws SQLException {
        return catalogoRepository.obtenerEspacioPorId(idEspacio);
    }

    // RF-04: Recursos y Dotación de Espacios
    public List<Recurso> listarRecursos() throws SQLException {
        return catalogoRepository.listarRecursos();
    }

    public Recurso crearRecurso(Recurso recurso) throws SQLException {
        return catalogoRepository.crearRecurso(recurso);
    }

    public Recurso actualizarRecurso(int idRecurso, Recurso recurso) throws SQLException {
        return catalogoRepository.actualizarRecurso(idRecurso, recurso);
    }

    public List<EspacioRecurso> listarRecursosPorEspacio(int idEspacio) throws SQLException {
        return catalogoRepository.listarRecursosPorEspacio(idEspacio);
    }

    public EspacioRecurso asignarRecursoAEspacio(int idEspacio, int idRecurso, int cantidad) throws SQLException {
        return catalogoRepository.asignarRecursoAEspacio(idEspacio, idRecurso, cantidad);
    }

    public void eliminarRecursoDeEspacio(int idEspacio, int idRecurso) throws SQLException {
        catalogoRepository.eliminarRecursoDeEspacio(idEspacio, idRecurso);
    }

    // RF-05: Cursos y Recursos Requeridos
    public List<Curso> listarCursos() throws SQLException {
        return catalogoRepository.listarCursos();
    }

    public Curso obtenerCursoPorId(int idCurso) throws SQLException {
        return catalogoRepository.obtenerCursoPorId(idCurso);
    }

    public Curso crearCurso(Curso curso) throws SQLException {
        return catalogoRepository.crearCurso(curso);
    }

    public Curso actualizarCurso(int idCurso, Curso curso) throws SQLException {
        return catalogoRepository.actualizarCurso(idCurso, curso);
    }

    public List<CursoRecurso> listarRecursosDeCurso(int idCurso) throws SQLException {
        return catalogoRepository.listarRecursosDeCurso(idCurso);
    }

    public CursoRecurso agregarRecursoACurso(int idCurso, int idRecurso) throws SQLException {
        return catalogoRepository.agregarRecursoACurso(idCurso, idRecurso);
    }

    public void eliminarRecursoDeCurso(int idCurso, int idRecurso) throws SQLException {
        catalogoRepository.eliminarRecursoDeCurso(idCurso, idRecurso);
    }

    // RF-06: Habilitación de Docentes por Curso
    public List<DocenteCurso> listarCursosPorDocente(int idDocente) throws SQLException {
        return catalogoRepository.listarCursosPorDocente(idDocente);
    }

    public List<DocenteCurso> listarDocentesPorCurso(int idCurso) throws SQLException {
        return catalogoRepository.listarDocentesPorCurso(idCurso);
    }

    public DocenteCurso habilitarDocenteEnCurso(int idDocente, int idCurso) throws SQLException {
        return catalogoRepository.habilitarDocenteEnCurso(idDocente, idCurso);
    }

    public void deshabilitarDocenteEnCurso(int idDocente, int idCurso) throws SQLException {
        catalogoRepository.deshabilitarDocenteEnCurso(idDocente, idCurso);
    }

    // RF-07: Franjas Horarias
    public List<Franja> listarFranjas() throws SQLException {
        return catalogoRepository.listarFranjas();
    }

    public Franja obtenerFranjaPorId(int idFranja) throws SQLException {
        return catalogoRepository.obtenerFranjaPorId(idFranja);
    }

    public Franja crearFranja(Franja franja) throws SQLException {
        return catalogoRepository.crearFranja(franja);
    }

    public Franja actualizarFranja(int idFranja, Franja franja) throws SQLException {
        return catalogoRepository.actualizarFranja(idFranja, franja);
    }

    // RF-08: Parámetros del Sistema
    public List<ParametroSistema> listarParametros() throws SQLException {
        return catalogoRepository.listarParametros();
    }

    public ParametroSistema actualizarParametro(String clave, ParametroSistema parametro) throws SQLException {
        return catalogoRepository.actualizarParametro(clave, parametro);
    }
}
