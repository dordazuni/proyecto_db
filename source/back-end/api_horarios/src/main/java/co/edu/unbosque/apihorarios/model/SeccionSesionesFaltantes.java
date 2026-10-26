package co.edu.unbosque.apihorarios.model;

public class SeccionSesionesFaltantes {

    private Integer idVersion;
    private Integer idSeccion;
    private String codigoCurso;
    private Integer numeroSeccion;
    private Integer frecuenciaSemanal;
    private Long sesionesAsignadas;
    private Long sesionesFaltantes;

    public SeccionSesionesFaltantes() {
    }

    public SeccionSesionesFaltantes(Integer idVersion, Integer idSeccion, String codigoCurso,
                                    Integer numeroSeccion, Integer frecuenciaSemanal,
                                    Long sesionesAsignadas, Long sesionesFaltantes) {
        this.idVersion = idVersion;
        this.idSeccion = idSeccion;
        this.codigoCurso = codigoCurso;
        this.numeroSeccion = numeroSeccion;
        this.frecuenciaSemanal = frecuenciaSemanal;
        this.sesionesAsignadas = sesionesAsignadas;
        this.sesionesFaltantes = sesionesFaltantes;
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

    public Integer getFrecuenciaSemanal() {
        return frecuenciaSemanal;
    }

    public void setFrecuenciaSemanal(Integer frecuenciaSemanal) {
        this.frecuenciaSemanal = frecuenciaSemanal;
    }

    public Long getSesionesAsignadas() {
        return sesionesAsignadas;
    }

    public void setSesionesAsignadas(Long sesionesAsignadas) {
        this.sesionesAsignadas = sesionesAsignadas;
    }

    public Long getSesionesFaltantes() {
        return sesionesFaltantes;
    }

    public void setSesionesFaltantes(Long sesionesFaltantes) {
        this.sesionesFaltantes = sesionesFaltantes;
    }
}
