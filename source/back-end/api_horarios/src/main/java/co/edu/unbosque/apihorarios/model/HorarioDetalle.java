package co.edu.unbosque.apihorarios.model;

import java.time.LocalTime;

public class HorarioDetalle {

    private Integer idAsignacion;
    private Integer idVersion;
    private Integer numeroVersion;
    private String estadoVersion;
    private Integer idPeriodo;
    private String periodo;
    private Integer idSeccion;
    private String codigoCurso;
    private String nombreCurso;
    private Integer numeroSeccion;
    private Integer idDocente;
    private String docente;
    private Integer idEspacio;
    private String codigoEspacio;
    private String tipoEspacio;
    private Integer idFranja;
    private Integer diaSemana;
    private String nombreDia;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    public HorarioDetalle() {
    }

    public HorarioDetalle(Integer idAsignacion, Integer idVersion, Integer numeroVersion, String estadoVersion,
                          Integer idPeriodo, String periodo, Integer idSeccion, String codigoCurso,
                          String nombreCurso, Integer numeroSeccion, Integer idDocente, String docente,
                          Integer idEspacio, String codigoEspacio, String tipoEspacio, Integer idFranja,
                          Integer diaSemana, String nombreDia, LocalTime horaInicio, LocalTime horaFin) {
        this.idAsignacion = idAsignacion;
        this.idVersion = idVersion;
        this.numeroVersion = numeroVersion;
        this.estadoVersion = estadoVersion;
        this.idPeriodo = idPeriodo;
        this.periodo = periodo;
        this.idSeccion = idSeccion;
        this.codigoCurso = codigoCurso;
        this.nombreCurso = nombreCurso;
        this.numeroSeccion = numeroSeccion;
        this.idDocente = idDocente;
        this.docente = docente;
        this.idEspacio = idEspacio;
        this.codigoEspacio = codigoEspacio;
        this.tipoEspacio = tipoEspacio;
        this.idFranja = idFranja;
        this.diaSemana = diaSemana;
        this.nombreDia = nombreDia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    public Integer getIdAsignacion() {
        return idAsignacion;
    }

    public void setIdAsignacion(Integer idAsignacion) {
        this.idAsignacion = idAsignacion;
    }

    public Integer getIdVersion() {
        return idVersion;
    }

    public void setIdVersion(Integer idVersion) {
        this.idVersion = idVersion;
    }

    public Integer getNumeroVersion() {
        return numeroVersion;
    }

    public void setNumeroVersion(Integer numeroVersion) {
        this.numeroVersion = numeroVersion;
    }

    public String getEstadoVersion() {
        return estadoVersion;
    }

    public void setEstadoVersion(String estadoVersion) {
        this.estadoVersion = estadoVersion;
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public Integer getIdSeccion() {
        return idSeccion;
    }

    public void setIdSeccion(Integer idSeccion) {
        this.idSeccion = idSeccion;
    }

    public String getCodigoCurso() {
        return codigoCurso;
    }

    public void setCodigoCurso(String codigoCurso) {
        this.codigoCurso = codigoCurso;
    }

    public String getNombreCurso() {
        return nombreCurso;
    }

    public void setNombreCurso(String nombreCurso) {
        this.nombreCurso = nombreCurso;
    }

    public Integer getNumeroSeccion() {
        return numeroSeccion;
    }

    public void setNumeroSeccion(Integer numeroSeccion) {
        this.numeroSeccion = numeroSeccion;
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

    public Integer getIdEspacio() {
        return idEspacio;
    }

    public void setIdEspacio(Integer idEspacio) {
        this.idEspacio = idEspacio;
    }

    public String getCodigoEspacio() {
        return codigoEspacio;
    }

    public void setCodigoEspacio(String codigoEspacio) {
        this.codigoEspacio = codigoEspacio;
    }

    public String getTipoEspacio() {
        return tipoEspacio;
    }

    public void setTipoEspacio(String tipoEspacio) {
        this.tipoEspacio = tipoEspacio;
    }

    public Integer getIdFranja() {
        return idFranja;
    }

    public void setIdFranja(Integer idFranja) {
        this.idFranja = idFranja;
    }

    public Integer getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(Integer diaSemana) {
        this.diaSemana = diaSemana;
    }

    public String getNombreDia() {
        return nombreDia;
    }

    public void setNombreDia(String nombreDia) {
        this.nombreDia = nombreDia;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }
}
