package co.edu.unbosque.apihorarios.model;

public class Docente {

    private Integer idDocente;
    private String tipoDocumento;
    private String numeroDocumento;
    private String nombres;
    private String apellidos;
    private String email;
    private String estadoVinculacion;
    private Integer idTipoContrato;
    private String nombreTipoContrato;
    private Integer horasMin;
    private Integer horasMax;

    public Docente() {
    }

    public Docente(Integer idDocente, String tipoDocumento, String numeroDocumento, String nombres,
                   String apellidos, String email, String estadoVinculacion, Integer idTipoContrato,
                   String nombreTipoContrato, Integer horasMin, Integer horasMax) {
        this.idDocente = idDocente;
        this.tipoDocumento = tipoDocumento;
        this.numeroDocumento = numeroDocumento;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.email = email;
        this.estadoVinculacion = estadoVinculacion;
        this.idTipoContrato = idTipoContrato;
        this.nombreTipoContrato = nombreTipoContrato;
        this.horasMin = horasMin;
        this.horasMax = horasMax;
    }

    public Integer getIdDocente() {
        return idDocente;
    }

    public void setIdDocente(Integer idDocente) {
        this.idDocente = idDocente;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public String getNumeroDocumento() {
        return numeroDocumento;
    }

    public void setNumeroDocumento(String numeroDocumento) {
        this.numeroDocumento = numeroDocumento;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEstadoVinculacion() {
        return estadoVinculacion;
    }

    public void setEstadoVinculacion(String estadoVinculacion) {
        this.estadoVinculacion = estadoVinculacion;
    }

    public Integer getIdTipoContrato() {
        return idTipoContrato;
    }

    public void setIdTipoContrato(Integer idTipoContrato) {
        this.idTipoContrato = idTipoContrato;
    }

    public String getNombreTipoContrato() {
        return nombreTipoContrato;
    }

    public void setNombreTipoContrato(String nombreTipoContrato) {
        this.nombreTipoContrato = nombreTipoContrato;
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
}
