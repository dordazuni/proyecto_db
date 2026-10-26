package co.edu.unbosque.apihorarios.model;

public class CursoRecurso {

    private Integer idCurso;
    private Integer idRecurso;
    private String nombreRecurso;
    private String categoriaRecurso;

    public CursoRecurso() {
    }

    public CursoRecurso(Integer idCurso, Integer idRecurso, String nombreRecurso, String categoriaRecurso) {
        this.idCurso = idCurso;
        this.idRecurso = idRecurso;
        this.nombreRecurso = nombreRecurso;
        this.categoriaRecurso = categoriaRecurso;
    }

    public Integer getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(Integer idCurso) {
        this.idCurso = idCurso;
    }

    public Integer getIdRecurso() {
        return idRecurso;
    }

    public void setIdRecurso(Integer idRecurso) {
        this.idRecurso = idRecurso;
    }

    public String getNombreRecurso() {
        return nombreRecurso;
    }

    public void setNombreRecurso(String nombreRecurso) {
        this.nombreRecurso = nombreRecurso;
    }

    public String getCategoriaRecurso() {
        return categoriaRecurso;
    }

    public void setCategoriaRecurso(String categoriaRecurso) {
        this.categoriaRecurso = categoriaRecurso;
    }
}
