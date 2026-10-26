package co.edu.unbosque.apihorarios.model;

public class CargaDocente {

    private Integer idVersion;
    private Integer idPeriodo;
    private Integer idDocente;
    private String docente;
    private String tipoContrato;
    private Long sesiones;
    private Long cargaAsignada;
    private Integer horasMin;
    private Integer horasMax;
    private String estadoCarga;

    public CargaDocente() {
    }

    public CargaDocente(Integer idVersion, Integer idPeriodo, Integer idDocente, String docente,
                        String tipoContrato, Long sesiones, Long cargaAsignada,
                        Integer horasMin, Integer horasMax, String estadoCarga) {
        this.idVersion = idVersion;
        this.idPeriodo = idPeriodo;
        this.idDocente = idDocente;
        this.docente = docente;
        this.tipoContrato = tipoContrato;
        this.sesiones = sesiones;
        this.cargaAsignada = cargaAsignada;
        this.horasMin = horasMin;
        this.horasMax = horasMax;
        this.estadoCarga = estadoCarga;
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

    public Integer getIdDocente() {
        return idDocente;
    }

    public void setIdDocente(Integer idDocente) {
        this.idDocente = idDocente;
    }

    public String getDocente() {
        return docente;
    }

    public void setDocente(String docente) {
        this.docente = docente;
    }

    public String getTipoContrato() {
        return tipoContrato;
    }

    public void setTipoContrato(String tipoContrato) {
        this.tipoContrato = tipoContrato;
    }

    public Long getSesiones() {
        return sesiones;
    }

    public void setSesiones(Long sesiones) {
        this.sesiones = sesiones;
    }

    public Long getCargaAsignada() {
        return cargaAsignada;
    }

    public void setCargaAsignada(Long cargaAsignada) {
        this.cargaAsignada = cargaAsignada;
    }

    public Integer getHorasMin() {
        return horasMin;
    }

    public void setHorasMin(Integer horasMin) {
        this.horasMin = horasMin;
    }

    public Integer getHorasMax() {
        return horasMax;
    }

    public void setHorasMax(Integer horasMax) {
        this.horasMax = horasMax;
    }

    public String getEstadoCarga() {
        return estadoCarga;
    }

    public void setEstadoCarga(String estadoCarga) {
        this.estadoCarga = estadoCarga;
    }
}
