package co.edu.unbosque.apihorarios.security;

import co.edu.unbosque.apihorarios.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AuthTokenService {

    private static final long EXPIRATION_SECONDS = 8L * 60L * 60L; // 8 horas
    private static final String HMAC_ALG = "HmacSHA256";

    private final byte[] secretBytes;

    public AuthTokenService(
            @Value("${sigh.jwt.secret:SIGH_JWT_SECRET_KEY_2026_UNBOSQUE_HORARIOS_RNF04}") String secret) {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(Usuario usuario) {
        long now = Instant.now().getEpochSecond();
        long exp = now + EXPIRATION_SECONDS;

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = String.format(
                "{\"idUsuario\":%d,\"nombreUsuario\":\"%s\",\"idRol\":%d,\"nombreRol\":\"%s\",\"idDocente\":%s,\"iat\":%d,\"exp\":%d}",
                usuario.getIdUsuario(),
                escapeJson(usuario.getNombreUsuario()),
                usuario.getIdRol(),
                escapeJson(usuario.getNombreRol()),
                usuario.getIdDocente() != null ? usuario.getIdDocente().toString() : "null",
                now,
                exp
        );

        String headerB64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
        String payloadB64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = headerB64 + "." + payloadB64;
        String signatureB64 = sign(signingInput);

        return signingInput + "." + signatureB64;
    }

    public Usuario verifyToken(String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("RF-23", "Token de autenticación ausente.");
        }
        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            throw new UnauthorizedException("RF-23", "Formato de token inválido.");
        }

        String signingInput = parts[0] + "." + parts[1];
        String expectedSig = sign(signingInput);
        if (!MessageDigest.isEqual(
                expectedSig.getBytes(StandardCharsets.UTF_8),
                parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("RF-23", "Firma de token inválida.");
        }

        String payloadJson;
        try {
            payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("RF-23", "Token malformado.");
        }

        Long exp = extractLong(payloadJson, "exp");
        long now = Instant.now().getEpochSecond();
        if (exp == null || now > exp) {
            throw new UnauthorizedException("RF-23", "La sesión ha expirado. Inicie sesión nuevamente.");
        }

        Integer idUsuario = extractInt(payloadJson, "idUsuario");
        String nombreUsuario = extractString(payloadJson, "nombreUsuario");
        Integer idRol = extractInt(payloadJson, "idRol");
        String nombreRol = extractString(payloadJson, "nombreRol");
        Integer idDocente = extractInt(payloadJson, "idDocente");

        if (idUsuario == null || nombreUsuario == null || nombreRol == null) {
            throw new UnauthorizedException("RF-23", "Token incompleto o inválido.");
        }

        return new Usuario(idUsuario, nombreUsuario, null, true, idRol, nombreRol, idDocente, null);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(new SecretKeySpec(secretBytes, HMAC_ALG));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64UrlEncode(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar el token JWT", e);
        }
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private Integer extractInt(String json, String key) {
        Long val = extractLong(json, key);
        return val != null ? val.intValue() : null;
    }

    private Long extractLong(String json, String key) {
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+)");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return Long.parseLong(m.group(1));
        }
        return null;
    }

    private String extractString(String json, String key) {
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}
