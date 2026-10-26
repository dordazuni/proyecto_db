package co.edu.unbosque.apihorarios.model;

import java.time.OffsetDateTime;

public class VersionHorario {

    private Integer idVersion;
    private Integer idPeriodo;
    private String codigoPeriodo;
    private Integer numeroVersion;
    private String estado;
    private OffsetDateTime fechaAval;
    private String idDocumentoExterno;
    private Integer idUsuarioAval;
    private String nombreUsuarioAval;
    private Integer idUsuario;

    public VersionHorario() {
    }

    public VersionHorario(Integer idVersion, Integer idPeriodo, String codigoPeriodo, Integer numeroVersion,
                          String estado, OffsetDateTime fechaAval, String idDocumentoExterno,
                          Integer idUsuarioAval, String nombreUsuarioAval) {
        this.idVersion = idVersion;
        this.idPeriodo = idPeriodo;
        this.codigoPeriodo = codigoPeriodo;
        this.numeroVersion = numeroVersion;
        this.estado = estado;
        this.fechaAval = fechaAval;
        this.idDocumentoExterno = idDocumentoExterno;
        this.idUsuarioAval = idUsuarioAval;
        this.nombreUsuarioAval = nombreUsuarioAval;
    }

    public Integer getIdVersion() {
        return idVersion;
    }

    public void setIdVersion(Integer idVersion) {
        this.idVersion = idVersion;
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
    }

    public String getCodigoPeriodo() {
        return codigoPeriodo;
    }

    public void setCodigoPeriodo(String codigoPeriodo) {
        this.codigoPeriodo = codigoPeriodo;
    }

    public Integer getNumeroVersion() {
        return numeroVersion;
    }

    public void setNumeroVersion(Integer numeroVersion) {
        this.numeroVersion = numeroVersion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public OffsetDateTime getFechaAval() {
        return fechaAval;
    }

    public void setFechaAval(OffsetDateTime fechaAval) {
        this.fechaAval = fechaAval;
    }

    public String getIdDocumentoExterno() {
        return idDocumentoExterno;
    }

    public void setIdDocumentoExterno(String idDocumentoExterno) {
        this.idDocumentoExterno = idDocumentoExterno;
    }

    public Integer getIdUsuarioAval() {
        return idUsuarioAval;
    }

    public void setIdUsuarioAval(Integer idUsuarioAval) {
        this.idUsuarioAval = idUsuarioAval;
    }

    public String getNombreUsuarioAval() {
        return nombreUsuarioAval;
    }

    public void setNombreUsuarioAval(String nombreUsuarioAval) {
        this.nombreUsuarioAval = nombreUsuarioAval;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }
}
