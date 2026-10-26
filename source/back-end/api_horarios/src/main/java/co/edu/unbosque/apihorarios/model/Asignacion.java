package co.edu.unbosque.apihorarios.model;

import java.time.OffsetDateTime;

public class Asignacion {

    private Integer idAsignacion;
    private Integer idVersion;
    private Integer idSeccion;
    private Integer idDocente;
    private Integer idEspacio;
    private Integer idFranja;
    private Integer idUsuarioCreador;
    private OffsetDateTime fechaCreacion;
    private Integer idUsuario;

    public Asignacion() {
    }

    public Asignacion(Integer idAsignacion, Integer idVersion, Integer idSeccion, Integer idDocente,
                      Integer idEspacio, Integer idFranja, Integer idUsuarioCreador, OffsetDateTime fechaCreacion) {
        this.idAsignacion = idAsignacion;
        this.idVersion = idVersion;
        this.idSeccion = idSeccion;
        this.idDocente = idDocente;
        this.idEspacio = idEspacio;
        this.idFranja = idFranja;
        this.idUsuarioCreador = idUsuarioCreador;
        this.fechaCreacion = fechaCreacion;
    }

    public Integer getIdAsignacion() {
        return idAsignacion;
    }

    public void setIdAsignacion(Integer idAsignacion) {
        this.idAsignacion = idAsignacion;
    }

    public Integer getIdVersion() {
        return idVersion;
    }

    public void setIdVersion(Integer idVersion) {
        this.idVersion = idVersion;
    }

    public Integer getIdSeccion() {
        return idSeccion;
    }

    public void setIdSeccion(Integer idSeccion) {
        this.idSeccion = idSeccion;
    }

    public Integer getIdDocente() {
        return idDocente;
    }

    public void setIdDocente(Integer idDocente) {
        this.idDocente = idDocente;
    }

    public Integer getIdEspacio() {
        return idEspacio;
    }

    public void setIdEspacio(Integer idEspacio) {
        this.idEspacio = idEspacio;
    }

    public Integer getIdFranja() {
        return idFranja;
    }

    public void setIdFranja(Integer idFranja) {
        this.idFranja = idFranja;
    }

    public Integer getIdUsuarioCreador() {
        return idUsuarioCreador;
    }

    public void setIdUsuarioCreador(Integer idUsuarioCreador) {
        this.idUsuarioCreador = idUsuarioCreador;
    }

    public OffsetDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(OffsetDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }
}
