package co.edu.unbosque.apihorarios.model;

public class TipoContrato {

    private Integer idTipoContrato;
    private String nombre;
    private Integer horasMin;
    private Integer horasMax;

    public TipoContrato() {
    }

    public TipoContrato(Integer idTipoContrato, String nombre, Integer horasMin, Integer horasMax) {
        this.idTipoContrato = idTipoContrato;
        this.nombre = nombre;
        this.horasMin = horasMin;
        this.horasMax = horasMax;
    }

    public Integer getIdTipoContrato() {
        return idTipoContrato;
    }

    public void setIdTipoContrato(Integer idTipoContrato) {
        this.idTipoContrato = idTipoContrato;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getHorasMin() {
        return horasMin;
    }

    public void setHorasMin(Integer horasMin) {
        this.horasMin = horasMin;
    }

    public Integer getHorasMax() {
        return horasMax;
    }

    public void setHorasMax(Integer horasMax) {
        this.horasMax = horasMax;
    }
}
