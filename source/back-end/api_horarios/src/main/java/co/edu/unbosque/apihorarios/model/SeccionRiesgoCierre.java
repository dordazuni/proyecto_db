package co.edu.unbosque.apihorarios.model;

public class SeccionRiesgoCierre {

    private Integer idSeccion;
    private String periodo;
    private String codigoCurso;
    private String nombreCurso;
    private Integer numeroSeccion;
    private Integer matriculaReal;
    private Integer cupoMin;

    public SeccionRiesgoCierre() {
    }

    public SeccionRiesgoCierre(Integer idSeccion, String periodo, String codigoCurso, String nombreCurso,
                               Integer numeroSeccion, Integer matriculaReal, Integer cupoMin) {
        this.idSeccion = idSeccion;
        this.periodo = periodo;
        this.codigoCurso = codigoCurso;
        this.nombreCurso = nombreCurso;
        this.numeroSeccion = numeroSeccion;
        this.matriculaReal = matriculaReal;
        this.cupoMin = cupoMin;
    }

    public Integer getIdSeccion() {
        return idSeccion;
    }

    public void setIdSeccion(Integer idSeccion) {
        this.idSeccion = idSeccion;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
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

    public Integer getMatriculaReal() {
        return matriculaReal;
    }

    public void setMatriculaReal(Integer matriculaReal) {
        this.matriculaReal = matriculaReal;
    }

    public Integer getCupoMin() {
        return cupoMin;
    }

    public void setCupoMin(Integer cupoMin) {
        this.cupoMin = cupoMin;
    }
}
