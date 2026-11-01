package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.Asignacion;
import co.edu.unbosque.apihorarios.model.VersionHorario;
import co.edu.unbosque.apihorarios.repository.ProgramacionRepository;
import co.edu.unbosque.apihorarios.security.AuthContextHolder;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class ProgramacionService {

    private final ProgramacionRepository programacionRepository;

    public ProgramacionService(ProgramacionRepository programacionRepository) {
        this.programacionRepository = programacionRepository;
    }

    // RF-12: Versiones de Horario (el idUsuario sale exclusivamente del token)
    public List<VersionHorario> listarVersiones(Integer idPeriodo) throws SQLException {
        return programacionRepository.listarVersiones(idPeriodo);
    }

    public VersionHorario obtenerVersionPorId(int idVersion) throws SQLException {
        return programacionRepository.obtenerVersionPorId(idVersion);
    }

    public VersionHorario crearVersion(VersionHorario version) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.crearVersion(version, idUsuario);
    }

    // RF-15: Enviar versión a aprobación (EN_EDICION -> PENDIENTE)
    public VersionHorario enviarAAprobacion(int idVersion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.cambiarEstadoVersion(idVersion, "PENDIENTE", idUsuario);
    }

    // RF-16: Avalar versión (PENDIENTE -> AVALADO)
    public VersionHorario avalarVersion(int idVersion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.cambiarEstadoVersion(idVersion, "AVALADO", idUsuario);
    }

    // RF-16: Devolver versión a edición (PENDIENTE -> EN_EDICION)
    public VersionHorario devolverVersion(int idVersion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.cambiarEstadoVersion(idVersion, "EN_EDICION", idUsuario);
    }

    // RF-17: Sincronizar versión con repositorio documental externo (AVALADO -> SINCRONIZADO)
    public VersionHorario sincronizarVersion(int idVersion, String idDocumentoExterno) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.sincronizarVersion(idVersion, idDocumentoExterno, idUsuario);
    }

    // RF-18: Crear versión nueva a partir de una existente/avalada
    public VersionHorario clonarVersion(int idVersionOrigen) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.clonarVersion(idVersionOrigen, idUsuario);
    }

    // RF-13 y RF-14: Asignación de sesiones
    public List<Asignacion> listarAsignaciones(Integer idVersion) throws SQLException {
        return programacionRepository.listarAsignaciones(idVersion);
    }

    public Asignacion obtenerAsignacionPorId(int idAsignacion) throws SQLException {
        return programacionRepository.obtenerAsignacionPorId(idAsignacion);
    }

    public Asignacion crearAsignacion(Asignacion asignacion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.crearAsignacion(asignacion, idUsuario);
    }

    public Asignacion actualizarAsignacion(int idAsignacion, Asignacion asignacion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        return programacionRepository.actualizarAsignacion(idAsignacion, asignacion, idUsuario);
    }

    public void eliminarAsignacion(int idAsignacion) throws SQLException {
        int idUsuario = AuthContextHolder.requireCurrentUserId();
        programacionRepository.eliminarAsignacion(idAsignacion, idUsuario);
    }
}
