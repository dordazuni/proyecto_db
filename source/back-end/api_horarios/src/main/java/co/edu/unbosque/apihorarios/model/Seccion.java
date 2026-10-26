package co.edu.unbosque.apihorarios.model;

public class Seccion {

    private Integer idSeccion;
    private Integer idCurso;
    private String codigoCurso;
    private String nombreCurso;
    private Integer idPeriodo;
    private String codigoPeriodo;
    private Integer numero;
    private Integer cupoMax;
    private Integer cupoMin;
    private Integer matriculaProyectada;
    private Integer matriculaReal;
    private String justificacionSobrecupo;
    private String estado;

    public Seccion() {
    }

    public Seccion(Integer idSeccion, Integer idCurso, String codigoCurso, String nombreCurso,
                   Integer idPeriodo, String codigoPeriodo, Integer numero, Integer cupoMax,
                   Integer cupoMin, Integer matriculaProyectada, Integer matriculaReal,
                   String justificacionSobrecupo, String estado) {
        this.idSeccion = idSeccion;
        this.idCurso = idCurso;
        this.codigoCurso = codigoCurso;
        this.nombreCurso = nombreCurso;
        this.idPeriodo = idPeriodo;
        this.codigoPeriodo = codigoPeriodo;
        this.numero = numero;
        this.cupoMax = cupoMax;
        this.cupoMin = cupoMin;
        this.matriculaProyectada = matriculaProyectada;
        this.matriculaReal = matriculaReal;
        this.justificacionSobrecupo = justificacionSobrecupo;
        this.estado = estado;
    }

    public Integer getIdSeccion() {
        return idSeccion;
    }

    public void setIdSeccion(Integer idSeccion) {
        this.idSeccion = idSeccion;
    }

    public Integer getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(Integer idCurso) {
        this.idCurso = idCurso;
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

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public Integer getCupoMax() {
        return cupoMax;
    }

    public void setCupoMax(Integer cupoMax) {
        this.cupoMax = cupoMax;
    }

    public Integer getCupoMin() {
        return cupoMin;
    }

    public void setCupoMin(Integer cupoMin) {
        this.cupoMin = cupoMin;
    }

    public Integer getMatriculaProyectada() {
        return matriculaProyectada;
    }

    public void setMatriculaProyectada(Integer matriculaProyectada) {
        this.matriculaProyectada = matriculaProyectada;
    }

    public Integer getMatriculaReal() {
        return matriculaReal;
    }

    public void setMatriculaReal(Integer matriculaReal) {
        this.matriculaReal = matriculaReal;
    }

    public String getJustificacionSobrecupo() {
        return justificacionSobrecupo;
    }

    public void setJustificacionSobrecupo(String justificacionSobrecupo) {
        this.justificacionSobrecupo = justificacionSobrecupo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
