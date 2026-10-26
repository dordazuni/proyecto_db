package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.CargaDocente;
import co.edu.unbosque.apihorarios.model.HorarioDetalle;
import co.edu.unbosque.apihorarios.model.SeccionRiesgoCierre;
import co.edu.unbosque.apihorarios.model.SeccionSesionesFaltantes;
import co.edu.unbosque.apihorarios.model.SesionDiasConsecutivos;
import co.edu.unbosque.apihorarios.repository.ReporteRepository;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;

    public ReporteService(ReporteRepository reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    // RF-19: Horario por versión, docente, espacio y sección
    public List<HorarioDetalle> consultarHorario(Integer idVersion, Integer idDocente,
                                                 Integer idEspacio, Integer idSeccion,
                                                 Integer idPeriodo) throws SQLException {
        return reporteRepository.consultarHorario(idVersion, idDocente, idEspacio, idSeccion, idPeriodo);
    }

    // RF-20: Carga docente frente a horas del contrato
    public List<CargaDocente> consultarCargaDocente(Integer idVersion, Integer idDocente,
                                                    String estadoCarga) throws SQLException {
        return reporteRepository.consultarCargaDocente(idVersion, idDocente, estadoCarga);
    }

    // RF-21: Secciones en riesgo de cierre
    public List<SeccionRiesgoCierre> consultarSeccionesRiesgoCierre(String periodo) throws SQLException {
        return reporteRepository.consultarSeccionesRiesgoCierre(periodo);
    }

    // RF-22: Secciones con sesiones faltantes y sesiones en días consecutivos
    public List<SeccionSesionesFaltantes> consultarSeccionesSesionesFaltantes(Integer idVersion) throws SQLException {
        return reporteRepository.consultarSeccionesSesionesFaltantes(idVersion);
    }

    public List<SesionDiasConsecutivos> consultarSesionesDiasConsecutivos(Integer idVersion) throws SQLException {
        return reporteRepository.consultarSesionesDiasConsecutivos(idVersion);
    }
}
