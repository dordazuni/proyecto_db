package co.edu.unbosque.apihorarios.security;

public class UnauthorizedException extends RuntimeException {

    private final String regla;

    public UnauthorizedException(String message) {
        this("RF-23", message);
    }

    public UnauthorizedException(String regla, String message) {
        super(message);
        this.regla = regla;
    }

    public String getRegla() {
        return regla;
    }
}
