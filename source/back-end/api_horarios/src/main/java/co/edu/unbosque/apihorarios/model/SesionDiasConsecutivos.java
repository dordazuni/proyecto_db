package co.edu.unbosque.apihorarios.model;

public class SesionDiasConsecutivos {

    private Integer idVersion;
    private Integer idSeccion;
    private String codigoCurso;
    private Integer numeroSeccion;
    private String dia1;
    private String dia2;

    public SesionDiasConsecutivos() {
    }

    public SesionDiasConsecutivos(Integer idVersion, Integer idSeccion, String codigoCurso,
                                  Integer numeroSeccion, String dia1, String dia2) {
        this.idVersion = idVersion;
        this.idSeccion = idSeccion;
        this.codigoCurso = codigoCurso;
        this.numeroSeccion = numeroSeccion;
        this.dia1 = dia1;
        this.dia2 = dia2;
    }

    public Integer getIdVersion() {
        return idVersion;
    }

    public void setIdVersion(Integer idVersion) {
        this.idVersion = idVersion;
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

    public Integer getNumeroSeccion() {
        return numeroSeccion;
    }

    public void setNumeroSeccion(Integer numeroSeccion) {
        this.numeroSeccion = numeroSeccion;
    }

    public String getDia1() {
        return dia1;
    }

    public void setDia1(String dia1) {
        this.dia1 = dia1;
    }

    public String getDia2() {
        return dia2;
    }

    public void setDia2(String dia2) {
        this.dia2 = dia2;
    }
}
