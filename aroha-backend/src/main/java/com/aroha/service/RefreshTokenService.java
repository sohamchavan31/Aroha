package com.aroha.service;

import com.aroha.model.RefreshToken;
import com.aroha.model.User;
import com.aroha.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Keeps people signed in: the short-lived JWT is renewed with a refresh token
 * that lasts {@code aroha.refresh.days} and is replaced on every use.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repository;

    @Value("${aroha.refresh.days:60}")
    private int refreshDays;

    /** Issues a new refresh token for the user and returns its raw value (shown once). */
    @Transactional
    public String issue(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = Instant.now();
        repository.deleteExpired(now);
        repository.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hash(raw))
                .createdAt(now)
                .expiresAt(now.plus(Duration.ofDays(refreshDays)))
                .build());
        return raw;
    }

    /** Checks a refresh token and spends it. Returns the user id it belonged to. */
    @Transactional
    public Long consume(String raw) {
        RefreshToken token = repository.findByTokenHash(hash(raw))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again"));
        repository.delete(token);
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again");
        }
        return token.getUserId();
    }

    /** Signs a device out (unknown tokens are ignored). */
    @Transactional
    public void revoke(String raw) {
        repository.findByTokenHash(hash(raw)).ifPresent(repository::delete);
    }

    static String hash(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
