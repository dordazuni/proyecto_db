package co.edu.unbosque.apihorarios.model;

public class DocenteCurso {

    private Integer idDocente;
    private String nombreDocente;
    private Integer idCurso;
    private String codigoCurso;
    private String nombreCurso;

    public DocenteCurso() {
    }

    public DocenteCurso(Integer idDocente, String nombreDocente, Integer idCurso, String codigoCurso, String nombreCurso) {
        this.idDocente = idDocente;
        this.nombreDocente = nombreDocente;
        this.idCurso = idCurso;
        this.codigoCurso = codigoCurso;
        this.nombreCurso = nombreCurso;
    }

    public Integer getIdDocente() {
        return idDocente;
    }

    public void setIdDocente(Integer idDocente) {
        this.idDocente = idDocente;
    }

    public String getNombreDocente() {
        return nombreDocente;
    }

    public void setNombreDocente(String nombreDocente) {
        this.nombreDocente = nombreDocente;
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
}
