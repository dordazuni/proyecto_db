package co.edu.unbosque.apihorarios.model;

public class EspacioRecurso {

    private Integer idEspacio;
    private Integer idRecurso;
    private String nombreRecurso;
    private String categoriaRecurso;
    private Integer cantidad;

    public EspacioRecurso() {
    }

    public EspacioRecurso(Integer idEspacio, Integer idRecurso, String nombreRecurso, String categoriaRecurso, Integer cantidad) {
        this.idEspacio = idEspacio;
        this.idRecurso = idRecurso;
        this.nombreRecurso = nombreRecurso;
        this.categoriaRecurso = categoriaRecurso;
        this.cantidad = cantidad;
    }

    public Integer getIdEspacio() {
        return idEspacio;
    }

    public void setIdEspacio(Integer idEspacio) {
        this.idEspacio = idEspacio;
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

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
