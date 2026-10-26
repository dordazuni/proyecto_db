package co.edu.unbosque.apihorarios.model;

public class Recurso {

    private Integer idRecurso;
    private String nombre;
    private String categoria;

    public Recurso() {
    }

    public Recurso(Integer idRecurso, String nombre, String categoria) {
        this.idRecurso = idRecurso;
        this.nombre = nombre;
        this.categoria = categoria;
    }

    public Integer getIdRecurso() {
        return idRecurso;
    }

    public void setIdRecurso(Integer idRecurso) {
        this.idRecurso = idRecurso;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
}
