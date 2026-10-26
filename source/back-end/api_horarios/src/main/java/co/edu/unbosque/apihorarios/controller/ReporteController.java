package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.CargaDocente;
import co.edu.unbosque.apihorarios.model.HorarioDetalle;
import co.edu.unbosque.apihorarios.model.SeccionRiesgoCierre;
import co.edu.unbosque.apihorarios.model.SeccionSesionesFaltantes;
import co.edu.unbosque.apihorarios.model.SesionDiasConsecutivos;
import co.edu.unbosque.apihorarios.service.ReporteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    // =====================================================================
    // RF-19: Consultar el horario de una versión por docente, por espacio y por sección
    // =====================================================================
    @GetMapping("/horario")
    public ResponseEntity<List<HorarioDetalle>> consultarHorario(
            @RequestParam(required = false) Integer idVersion,
            @RequestParam(required = false) Integer idDocente,
            @RequestParam(required = false) Integer idEspacio,
            @RequestParam(required = false) Integer idSeccion,
            @RequestParam(required = false) Integer idPeriodo) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarHorario(idVersion, idDocente, idEspacio, idSeccion, idPeriodo));
    }

    @GetMapping("/horario/version/{idVersion}/docente/{idDocente}")
    public ResponseEntity<List<HorarioDetalle>> consultarHorarioPorDocente(
            @PathVariable int idVersion,
            @PathVariable int idDocente) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarHorario(idVersion, idDocente, null, null, null));
    }

    @GetMapping("/horario/version/{idVersion}/espacio/{idEspacio}")
    public ResponseEntity<List<HorarioDetalle>> consultarHorarioPorEspacio(
            @PathVariable int idVersion,
            @PathVariable int idEspacio) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarHorario(idVersion, null, idEspacio, null, null));
    }

    @GetMapping("/horario/version/{idVersion}/seccion/{idSeccion}")
    public ResponseEntity<List<HorarioDetalle>> consultarHorarioPorSeccion(
            @PathVariable int idVersion,
            @PathVariable int idSeccion) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarHorario(idVersion, null, null, idSeccion, null));
    }

    // =====================================================================
    // RF-20: Consultar la carga horaria de cada docente frente a su contrato
    // =====================================================================
    @GetMapping("/carga-docente")
    public ResponseEntity<List<CargaDocente>> consultarCargaDocente(
            @RequestParam(required = false) Integer idVersion,
            @RequestParam(required = false) Integer idDocente,
            @RequestParam(required = false) String estadoCarga) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarCargaDocente(idVersion, idDocente, estadoCarga));
    }

    // =====================================================================
    // RF-21: Consultar secciones en riesgo de cierre (matrícula real < cupo mínimo)
    // =====================================================================
    @GetMapping("/secciones-riesgo-cierre")
    public ResponseEntity<List<SeccionRiesgoCierre>> consultarSeccionesRiesgoCierre(
            @RequestParam(required = false) String periodo) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarSeccionesRiesgoCierre(periodo));
    }

    // =====================================================================
    // RF-22: Consultar secciones con sesiones faltantes y sesiones en días consecutivos
    // =====================================================================
    @GetMapping("/secciones-sesiones-faltantes")
    public ResponseEntity<List<SeccionSesionesFaltantes>> consultarSeccionesSesionesFaltantes(
            @RequestParam(required = false) Integer idVersion) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarSeccionesSesionesFaltantes(idVersion));
    }

    @GetMapping("/sesiones-dias-consecutivos")
    public ResponseEntity<List<SesionDiasConsecutivos>> consultarSesionesDiasConsecutivos(
            @RequestParam(required = false) Integer idVersion) throws SQLException {
        return ResponseEntity.ok(reporteService.consultarSesionesDiasConsecutivos(idVersion));
    }
}
