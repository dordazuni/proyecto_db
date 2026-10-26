package co.edu.unbosque.apihorarios.model;

public class Curso {

    private Integer idCurso;
    private String codigo;
    private String nombre;
    private Integer frecuenciaSemanal;
    private Integer horasSemanales;

    public Curso() {
    }

    public Curso(Integer idCurso, String codigo, String nombre, Integer frecuenciaSemanal, Integer horasSemanales) {
        this.idCurso = idCurso;
        this.codigo = codigo;
        this.nombre = nombre;
        this.frecuenciaSemanal = frecuenciaSemanal;
        this.horasSemanales = horasSemanales;
    }

    public Integer getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(Integer idCurso) {
        this.idCurso = idCurso;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getFrecuenciaSemanal() {
        return frecuenciaSemanal;
    }

    public void setFrecuenciaSemanal(Integer frecuenciaSemanal) {
        this.frecuenciaSemanal = frecuenciaSemanal;
    }

    public Integer getHorasSemanales() {
        return horasSemanales;
    }

    public void setHorasSemanales(Integer horasSemanales) {
        this.horasSemanales = horasSemanales;
    }
}
