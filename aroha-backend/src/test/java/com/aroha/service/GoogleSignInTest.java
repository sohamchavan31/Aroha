package com.aroha.service;

import com.aroha.dto.AuthResponse;
import com.aroha.dto.LoginRequest;
import com.aroha.dto.RegisterRequest;
import com.aroha.model.User;
import com.aroha.repository.UserRepository;
import com.aroha.security.GoogleTokenVerifier;
import com.aroha.security.GoogleTokenVerifier.GoogleUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
class GoogleSignInTest {

    @Autowired AuthService authService;
    @Autowired AccountService accountService;
    @Autowired UserRepository userRepository;
    @MockBean GoogleTokenVerifier verifier;
    @MockBean MailService mailService;

    @Test
    void newGoogleUserGetsAVerifiedAccountWithoutAPassword() {
        when(verifier.verify("t1")).thenReturn(new GoogleUser("sub-1", "Riya@Gmail.com", true, "Riya Patil"));
        AuthResponse auth = authService.googleSignIn("t1");
        assertNotNull(auth.getToken());
        assertTrue(auth.isEmailVerified());
        assertFalse(auth.isProfileComplete());
        User u = userRepository.findByEmailIgnoreCase("riya@gmail.com").orElseThrow();
        assertEquals("sub-1", u.getGoogleSub());
        assertEquals("Riya Patil", u.getName());
        assertFalse(u.isPasswordSet());

        // signing in again finds the same account
        authService.googleSignIn("t1");
        assertEquals(1, userRepository.findAll().stream().filter(x -> "sub-1".equals(x.getGoogleSub())).count());
    }

    @Test
    void existingEmailAccountIsLinkedAndKeepsItsPassword() {
        RegisterRequest r = new RegisterRequest();
        r.setName("Soham");
        r.setEmail("soham.g@example.com");
        r.setPassword("secret123");
        authService.register(r);

        when(verifier.verify("t2")).thenReturn(new GoogleUser("sub-2", "soham.g@example.com", true, "Soham C"));
        authService.googleSignIn("t2");
        User u = userRepository.findByEmailIgnoreCase("soham.g@example.com").orElseThrow();
        assertEquals("sub-2", u.getGoogleSub());
        assertTrue(u.isEmailVerified(), "Google vouched for the email");
        assertTrue(u.isPasswordSet());
        assertEquals("Soham", u.getName(), "linking doesn't rename");

        LoginRequest login = new LoginRequest();
        login.setEmail("soham.g@example.com");
        login.setPassword("secret123");
        assertNotNull(authService.login(login).getToken());
    }

    @Test
    void unverifiedGoogleEmailIsRefused() {
        when(verifier.verify("t3")).thenReturn(new GoogleUser("sub-3", "x@example.com", false, "X"));
        assertThrows(ResponseStatusException.class, () -> authService.googleSignIn("t3"));
        assertTrue(userRepository.findByEmailIgnoreCase("x@example.com").isEmpty());
    }

    @Test
    void googleOnlyAccountDeletesWithTypedConfirmation() {
        when(verifier.verify("t4")).thenReturn(new GoogleUser("sub-4", "del@example.com", true, "Del"));
        authService.googleSignIn("t4");
        User u = userRepository.findByEmailIgnoreCase("del@example.com").orElseThrow();
        assertThrows(ResponseStatusException.class, () -> accountService.deleteAccount(u, null, "delete please"));
        accountService.deleteAccount(u, null, "DELETE");
        assertTrue(userRepository.findByEmailIgnoreCase("del@example.com").isEmpty());
    }

    @Test
    void realVerifierRefusesWhenNotConfigured() {
        GoogleTokenVerifier unconfigured = new GoogleTokenVerifier("");
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> unconfigured.verify("anything"));
        assertEquals(503, e.getStatusCode().value());
    }

    @Test
    void forgedTokenIsAPlainFailure() {
        GoogleTokenVerifier configured = new GoogleTokenVerifier("web-client.apps.googleusercontent.com");
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> configured.verify("not.a.jwt"));
        assertEquals(400, e.getStatusCode().value());
    }
}
