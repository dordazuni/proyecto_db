package co.edu.unbosque.apihorarios.model;

import java.time.OffsetDateTime;

public class LogAuditoria {

    private Long idLog;
    private Integer idUsuario;
    private String nombreUsuario;
    private OffsetDateTime fechaHora;
    private String accion;
    private String tablaAfectada;
    private String detalle;

    public LogAuditoria() {
    }

    public LogAuditoria(Long idLog, Integer idUsuario, String nombreUsuario, OffsetDateTime fechaHora,
                        String accion, String tablaAfectada, String detalle) {
        this.idLog = idLog;
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.fechaHora = fechaHora;
        this.accion = accion;
        this.tablaAfectada = tablaAfectada;
        this.detalle = detalle;
    }

    public Long getIdLog() {
        return idLog;
    }

    public void setIdLog(Long idLog) {
        this.idLog = idLog;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public OffsetDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(OffsetDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getTablaAfectada() {
        return tablaAfectada;
    }

    public void setTablaAfectada(String tablaAfectada) {
        this.tablaAfectada = tablaAfectada;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }
}
