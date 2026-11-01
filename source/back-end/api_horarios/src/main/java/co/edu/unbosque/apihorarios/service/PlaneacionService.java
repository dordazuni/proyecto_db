package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.Disponibilidad;
import co.edu.unbosque.apihorarios.model.Seccion;
import co.edu.unbosque.apihorarios.repository.PlaneacionRepository;
import co.edu.unbosque.apihorarios.security.AuthContextHolder;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class PlaneacionService {

    private final PlaneacionRepository planeacionRepository;

    public PlaneacionService(PlaneacionRepository planeacionRepository) {
        this.planeacionRepository = planeacionRepository;
    }

    // RF-09 y RF-10: Secciones
    public List<Seccion> listarSecciones(Integer idPeriodo, Integer idCurso) throws SQLException {
        return planeacionRepository.listarSecciones(idPeriodo, idCurso);
    }

    public Seccion obtenerSeccionPorId(int idSeccion) throws SQLException {
        return planeacionRepository.obtenerSeccionPorId(idSeccion);
    }

    public Seccion crearSeccion(Seccion seccion) throws SQLException {
        return planeacionRepository.crearSeccion(seccion);
    }

    public Seccion actualizarSeccion(int idSeccion, Seccion seccion) throws SQLException {
        return planeacionRepository.actualizarSeccion(idSeccion, seccion);
    }

    public Seccion registrarMatriculaReal(int idSeccion, int matriculaReal) throws SQLException {
        return planeacionRepository.registrarMatriculaReal(idSeccion, matriculaReal);
    }

    public Seccion cerrarSeccion(int idSeccion) throws SQLException {
        return planeacionRepository.cambiarEstadoSeccion(idSeccion, "CERRADA");
    }

    public Seccion cambiarEstadoSeccion(int idSeccion, String estado) throws SQLException {
        return planeacionRepository.cambiarEstadoSeccion(idSeccion, estado);
    }

    // RF-11: Disponibilidad de Docentes (el idUsuario sale exclusivamente del token)
    public List<Disponibilidad> listarDisponibilidad(Integer idDocente, Integer idPeriodo) throws SQLException {
        return planeacionRepository.listarDisponibilidad(idDocente, idPeriodo);
    }

    public Disponibilidad registrarDisponibilidad(Disponibilidad disponibilidad) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return planeacionRepository.registrarDisponibilidad(disponibilidad, idUsuario);
    }

    public void eliminarDisponibilidad(int idDocente, int idPeriodo, int idFranja) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        planeacionRepository.eliminarDisponibilidad(idDocente, idPeriodo, idFranja, idUsuario);
    }
}
