package co.edu.unbosque.apihorarios.model;

import java.math.BigDecimal;

public class ParametroSistema {

    private String clave;
    private BigDecimal valor;
    private String descripcion;

    public ParametroSistema() {
    }

    public ParametroSistema(String clave, BigDecimal valor, String descripcion) {
        this.clave = clave;
        this.valor = valor;
        this.descripcion = descripcion;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}
