package co.edu.unbosque.apihorarios.model;

import java.time.LocalTime;

public class Disponibilidad {

    private Integer idDocente;
    private String nombreDocente;
    private Integer idPeriodo;
    private Integer idFranja;
    private Integer diaSemana;
    private String nombreDia;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String tipo;
    private Integer idUsuario;

    public Disponibilidad() {
    }

    public Disponibilidad(Integer idDocente, String nombreDocente, Integer idPeriodo, Integer idFranja,
                          Integer diaSemana, String nombreDia, LocalTime horaInicio, LocalTime horaFin, String tipo) {
        this.idDocente = idDocente;
        this.nombreDocente = nombreDocente;
        this.idPeriodo = idPeriodo;
        this.idFranja = idFranja;
        this.diaSemana = diaSemana;
        this.nombreDia = nombreDia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.tipo = tipo;
    }

    public Integer getIdDocente() {
        return idDocente;
    }

    public void setIdDocente(Integer idDocente) {
        this.idDocente = idDocente;
    }

    public String getNombreDocente() {
        return nombreDocente;
    }

    public void setNombreDocente(String nombreDocente) {
        this.nombreDocente = nombreDocente;
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
    }

    public Integer getIdFranja() {
        return idFranja;
    }

    public void setIdFranja(Integer idFranja) {
        this.idFranja = idFranja;
    }

    public Integer getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(Integer diaSemana) {
        this.diaSemana = diaSemana;
    }

    public String getNombreDia() {
        return nombreDia;
    }

    public void setNombreDia(String nombreDia) {
        this.nombreDia = nombreDia;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }
}
