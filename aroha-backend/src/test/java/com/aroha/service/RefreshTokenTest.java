package com.aroha.service;

import com.aroha.dto.AuthResponse;
import com.aroha.dto.RegisterRequest;
import com.aroha.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RefreshTokenTest {

    @Autowired AuthService authService;
    @Autowired RefreshTokenRepository refreshTokenRepository;

    private AuthResponse register(String email) {
        RegisterRequest r = new RegisterRequest();
        r.setName("Refresh Test");
        r.setEmail(email);
        r.setPassword("secret123");
        return authService.register(r);
    }

    @Test
    void signInReturnsARefreshTokenStoredOnlyAsAHash() {
        AuthResponse auth = register("refresh1@example.com");
        assertNotNull(auth.getRefreshToken());
        assertTrue(refreshTokenRepository.findByTokenHash(RefreshTokenService.hash(auth.getRefreshToken())).isPresent());
        assertTrue(refreshTokenRepository.findAll().stream().noneMatch(t -> t.getTokenHash().equals(auth.getRefreshToken())));
    }

    @Test
    void refreshRotatesTheToken() {
        AuthResponse first = register("refresh2@example.com");
        AuthResponse second = authService.refresh(first.getRefreshToken());
        assertNotNull(second.getToken());
        assertNotEquals(first.getRefreshToken(), second.getRefreshToken());
        // the old one is spent
        assertThrows(ResponseStatusException.class, () -> authService.refresh(first.getRefreshToken()));
        // the new one works
        assertNotNull(authService.refresh(second.getRefreshToken()).getToken());
    }

    @Test
    void logoutRevokesTheToken() {
        AuthResponse auth = register("refresh3@example.com");
        authService.logout(auth.getRefreshToken());
        assertThrows(ResponseStatusException.class, () -> authService.refresh(auth.getRefreshToken()));
    }

    @Test
    void unknownTokenIsRejected() {
        assertThrows(ResponseStatusException.class, () -> authService.refresh("not-a-real-token"));
    }
}
