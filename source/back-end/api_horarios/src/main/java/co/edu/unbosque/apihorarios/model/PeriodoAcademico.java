package co.edu.unbosque.apihorarios.model;

import java.time.LocalDate;

public class PeriodoAcademico {

    private Integer idPeriodo;
    private String codigo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String estado;

    public PeriodoAcademico() {
    }

    public PeriodoAcademico(Integer idPeriodo, String codigo, LocalDate fechaInicio, LocalDate fechaFin, String estado) {
        this.idPeriodo = idPeriodo;
        this.codigo = codigo;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = estado;
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
