package com.aroha.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Checks a Google sign-in ID token: signed by Google (keys fetched from Google
 * and cached), not expired, issued by Google, and meant for one of our OAuth
 * client IDs (GOOGLE_CLIENT_IDS, comma-separated; the Web client ID).
 */
@Component
public class GoogleTokenVerifier {

    public record GoogleUser(String sub, String email, boolean emailVerified, String name) {}

    private static final String JWKS = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final List<String> clientIds;
    private volatile JwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${aroha.google.client-ids:}") String clientIds) {
        this.clientIds = Arrays.stream(clientIds.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public GoogleUser verify(String idToken) {
        if (clientIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google sign-in isn't set up yet.");
        }
        Jwt jwt;
        try {
            jwt = decoder().decode(idToken);
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google sign-in failed. Try again.");
        }
        Object verified = jwt.getClaims().get("email_verified");
        return new GoogleUser(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                Boolean.TRUE.equals(verified) || "true".equals(String.valueOf(verified)),
                jwt.getClaimAsString("name"));
    }

    private JwtDecoder decoder() {
        if (decoder == null) {
            NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(JWKS).build();
            d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                    JwtValidators.createDefault(), // expiry and not-before
                    jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Not issued by Google", null)),
                    jwt -> jwt.getAudience() != null && jwt.getAudience().stream().anyMatch(clientIds::contains)
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Not for this app", null))));
            decoder = d;
        }
        return decoder;
    }
}
