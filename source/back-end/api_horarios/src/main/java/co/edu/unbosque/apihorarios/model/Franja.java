package co.edu.unbosque.apihorarios.model;

import java.time.LocalTime;

public class Franja {

    private Integer idFranja;
    private Integer diaSemana;
    private String nombreDia;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    public Franja() {
    }

    public Franja(Integer idFranja, Integer diaSemana, String nombreDia, LocalTime horaInicio, LocalTime horaFin) {
        this.idFranja = idFranja;
        this.diaSemana = diaSemana;
        this.nombreDia = nombreDia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
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
}
