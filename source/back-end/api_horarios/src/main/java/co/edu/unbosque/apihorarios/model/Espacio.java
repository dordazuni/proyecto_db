package co.edu.unbosque.apihorarios.model;

public class Espacio {

    private Integer idEspacio;
    private String codigo;
    private String nombre;
    private Integer capacidad;
    private String edificio;
    private String tipoEspacio;
    private Integer numeroEquipos;
    private String area;

    public Espacio() {
    }

    public Espacio(Integer idEspacio, String codigo, String nombre, Integer capacidad,
                   String edificio, String tipoEspacio, Integer numeroEquipos, String area) {
        this.idEspacio = idEspacio;
        this.codigo = codigo;
        this.nombre = nombre;
        this.capacidad = capacidad;
        this.edificio = edificio;
        this.tipoEspacio = tipoEspacio;
        this.numeroEquipos = numeroEquipos;
        this.area = area;
    }

    public Integer getIdEspacio() {
        return idEspacio;
    }

    public void setIdEspacio(Integer idEspacio) {
        this.idEspacio = idEspacio;
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

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public String getEdificio() {
        return edificio;
    }

    public void setEdificio(String edificio) {
        this.edificio = edificio;
    }

    public String getTipoEspacio() {
        return tipoEspacio;
    }

    public void setTipoEspacio(String tipoEspacio) {
        this.tipoEspacio = tipoEspacio;
    }

    public Integer getNumeroEquipos() {
        return numeroEquipos;
    }

    public void setNumeroEquipos(Integer numeroEquipos) {
        this.numeroEquipos = numeroEquipos;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }
}
