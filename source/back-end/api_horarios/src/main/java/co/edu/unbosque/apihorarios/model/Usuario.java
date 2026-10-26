package co.edu.unbosque.apihorarios.model;

public class Usuario {

    private Integer idUsuario;
    private String nombreUsuario;
    private String contrasena;
    private Boolean activo;
    private Integer idRol;
    private String nombreRol;
    private Integer idDocente;
    private String nombreDocente;

    public Usuario() {
    }

    public Usuario(Integer idUsuario, String nombreUsuario, String contrasena, Boolean activo,
                   Integer idRol, String nombreRol, Integer idDocente, String nombreDocente) {
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.contrasena = contrasena;
        this.activo = activo;
        this.idRol = idRol;
        this.nombreRol = nombreRol;
        this.idDocente = idDocente;
        this.nombreDocente = nombreDocente;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Integer getIdRol() {
        return idRol;
    }

    public void setIdRol(Integer idRol) {
        this.idRol = idRol;
    }

    public String getNombreRol() {
        return nombreRol;
    }

    public void setNombreRol(String nombreRol) {
        this.nombreRol = nombreRol;
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
}
