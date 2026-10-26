package co.edu.unbosque.apihorarios.model;

import java.time.LocalDateTime;

public class ApiErrorResponse {

    private int status;
    private String regla;
    private String message;
    private String sqlState;
    private LocalDateTime timestamp;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(int status, String regla, String message, String sqlState, LocalDateTime timestamp) {
        this.status = status;
        this.regla = regla;
        this.message = message;
        this.sqlState = sqlState;
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getRegla() {
        return regla;
    }

    public void setRegla(String regla) {
        this.regla = regla;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSqlState() {
        return sqlState;
    }

    public void setSqlState(String sqlState) {
        this.sqlState = sqlState;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
