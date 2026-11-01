package co.edu.unbosque.apihorarios.config;

import co.edu.unbosque.apihorarios.model.ApiErrorResponse;
import co.edu.unbosque.apihorarios.security.UnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Pattern RULE_PREFIX_PATTERN = Pattern.compile("(RN-\\d{2}|RF-\\d{2}|RNF-\\d{2}|S-\\d{2}|P-\\d{2})");
    private static final Pattern CONSTRAINT_RULE_PATTERN = Pattern.compile("_(rn\\d{2}|rf\\d{2}|s\\d{2}|p\\d{2})_", Pattern.CASE_INSENSITIVE);

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getRegla() != null ? ex.getRegla() : "RF-23",
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(SQLException.class)
    public ResponseEntity<ApiErrorResponse> handleSQLException(SQLException ex) {
        String rawMessage = ex.getMessage() != null ? ex.getMessage() : "Error en la base de datos";
        String sqlState = ex.getSQLState() != null ? ex.getSQLState() : "";
        String regla = extractRuleCode(rawMessage);

        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        if ("23505".equals(sqlState) || rawMessage.contains("RN-01") || rawMessage.contains("RN-02")
                || rawMessage.contains("RN-03") || rawMessage.contains("RN-16") || rawMessage.contains("RN-17")) {
            status = HttpStatus.CONFLICT;
        } else if ("42501".equals(sqlState)) {
            status = HttpStatus.FORBIDDEN;
            if ("N/A".equals(regla)) {
                regla = "RF-25";
            }
        }

        ApiErrorResponse error = new ApiErrorResponse(
                status.value(),
                regla,
                cleanPostgresMessage(rawMessage),
                sqlState,
                LocalDateTime.now()
        );
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NoSuchElementException ex) {
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD_REQUEST",
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    private String extractRuleCode(String message) {
        Matcher prefixMatcher = RULE_PREFIX_PATTERN.matcher(message);
        if (prefixMatcher.find()) {
            return prefixMatcher.group(1).toUpperCase();
        }
        Matcher constraintMatcher = CONSTRAINT_RULE_PATTERN.matcher(message);
        if (constraintMatcher.find()) {
            String raw = constraintMatcher.group(1).toUpperCase();
            return raw.replaceAll("([A-Z]+)(\\d+)", "$1-$2");
        }
        return "N/A";
    }

    private String cleanPostgresMessage(String raw) {
        String cleaned = raw;
        int whereIdx = cleaned.indexOf("\n  Where:");
        if (whereIdx > 0) {
            cleaned = cleaned.substring(0, whereIdx).trim();
        }
        int enIdx = cleaned.indexOf("\n  En:");
        if (enIdx > 0) {
            cleaned = cleaned.substring(0, enIdx).trim();
        }
        cleaned = cleaned.replaceFirst("^(?i)ERROR:\\s*", "").trim();
        return cleaned;
    }
}
