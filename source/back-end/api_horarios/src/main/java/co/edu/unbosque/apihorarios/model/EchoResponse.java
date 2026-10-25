package co.edu.unbosque.apihorarios.model;

import java.time.LocalDateTime;

public class EchoResponse {

    private String status;
    private boolean databaseConnected;
    private String message;
    private String databaseUrl;
    private LocalDateTime timestamp;

    public EchoResponse() {
    }

    public EchoResponse(String status, boolean databaseConnected, String message, String databaseUrl, LocalDateTime timestamp) {
        this.status = status;
        this.databaseConnected = databaseConnected;
        this.message = message;
        this.databaseUrl = databaseUrl;
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isDatabaseConnected() {
        return databaseConnected;
    }

    public void setDatabaseConnected(boolean databaseConnected) {
        this.databaseConnected = databaseConnected;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDatabaseUrl() {
        return databaseUrl;
    }

    public void setDatabaseUrl(String databaseUrl) {
        this.databaseUrl = databaseUrl;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
