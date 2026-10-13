package com.aroha.service;

import com.aroha.dto.AuthResponse;
import com.aroha.dto.LoginRequest;
import com.aroha.dto.RegisterRequest;
import com.aroha.dto.ResetPasswordRequest;
import com.aroha.model.EmailCode;
import com.aroha.model.User;
import com.aroha.repository.EmailCodeRepository;
import com.aroha.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
class EmailCodeTest {

    @Autowired AuthService authService;
    @Autowired UserRepository userRepository;
    @Autowired EmailCodeRepository emailCodeRepository;
    @MockBean MailService mailService;

    private User register(String email) {
        RegisterRequest r = new RegisterRequest();
        r.setName("Code Test");
        r.setEmail(email);
        r.setPassword("secret123");
        AuthResponse auth = authService.register(r);
        assertFalse(auth.isEmailVerified());
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    /** The most recent code emailed to this address. */
    private String lastCode(String email) {
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mailService, atLeastOnce()).sendCode(eq(email), anyString(), anyString(), code.capture(), anyString());
        return code.getValue();
    }

    // Lets the next "send" through without waiting out the one-minute cooldown.
    private void ageCodes(User user) {
        emailCodeRepository.findAll().stream().filter(c -> c.getUserId().equals(user.getId())).forEach(c -> {
            c.setCreatedAt(Instant.now().minusSeconds(120));
            emailCodeRepository.save(c);
        });
    }

    @Test
    void signUpEmailsACodeThatVerifiesTheAccount() {
        User user = register("verify1@example.com");
        String code = lastCode("verify1@example.com");
        assertTrue(code.matches("\\d{6}"));

        authService.verifyEmail(user, code);
        assertTrue(userRepository.findById(user.getId()).orElseThrow().isEmailVerified());
        // the code is spent
        assertTrue(emailCodeRepository.findFirstByUserIdAndPurpose(user.getId(), EmailCode.Purpose.VERIFY).isEmpty());
    }

    @Test
    void wrongCodesCountAndLockAfterFiveTries() {
        User user = register("verify2@example.com");
        String code = lastCode("verify2@example.com");
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < EmailCodeService.MAX_ATTEMPTS; i++) {
            assertThrows(ResponseStatusException.class, () -> authService.verifyEmail(user, wrong));
        }
        // even the right code fails now
        assertThrows(ResponseStatusException.class, () -> authService.verifyEmail(user, code));
        assertFalse(userRepository.findById(user.getId()).orElseThrow().isEmailVerified());
    }

    @Test
    void expiredCodeIsRejected() {
        User user = register("verify3@example.com");
        String code = lastCode("verify3@example.com");
        EmailCode stored = emailCodeRepository.findFirstByUserIdAndPurpose(user.getId(), EmailCode.Purpose.VERIFY).orElseThrow();
        stored.setExpiresAt(Instant.now().minusSeconds(1));
        emailCodeRepository.save(stored);

        assertThrows(ResponseStatusException.class, () -> authService.verifyEmail(user, code));
    }

    @Test
    void resendIsLimitedToOnceAMinuteAndReplacesTheOldCode() {
        User user = register("verify4@example.com");
        String first = lastCode("verify4@example.com");
        assertThrows(ResponseStatusException.class, () -> authService.sendVerification(user));

        ageCodes(user);
        authService.sendVerification(user);
        String second = lastCode("verify4@example.com");
        if (!first.equals(second)) {
            assertThrows(ResponseStatusException.class, () -> authService.verifyEmail(user, first));
        }
        authService.verifyEmail(user, second);
        assertTrue(userRepository.findById(user.getId()).orElseThrow().isEmailVerified());
    }

    @Test
    void forgotPasswordForUnknownEmailSendsNothing() {
        authService.forgotPassword("nobody@example.com");
        verify(mailService, never()).sendCode(eq("nobody@example.com"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void resetPasswordSetsNewPasswordAndSignsOutOtherDevices() {
        User user = register("reset1@example.com");
        LoginRequest old = new LoginRequest();
        old.setEmail("reset1@example.com");
        old.setPassword("secret123");
        AuthResponse otherDevice = authService.login(old);

        ageCodes(user);
        authService.forgotPassword("reset1@example.com");
        ResetPasswordRequest reset = new ResetPasswordRequest();
        reset.setEmail("reset1@example.com");
        reset.setCode(lastCode("reset1@example.com"));
        reset.setPassword("newsecret456");
        AuthResponse after = authService.resetPassword(reset);

        assertNotNull(after.getToken());
        assertTrue(after.isEmailVerified());
        assertThrows(ResponseStatusException.class, () -> authService.login(old));
        assertThrows(ResponseStatusException.class, () -> authService.refresh(otherDevice.getRefreshToken()));

        LoginRequest fresh = new LoginRequest();
        fresh.setEmail("reset1@example.com");
        fresh.setPassword("newsecret456");
        assertNotNull(authService.login(fresh).getToken());
    }

    @Test
    void resetCodeCannotBeUsedTwice() {
        User user = register("reset2@example.com");
        ageCodes(user);
        authService.forgotPassword("reset2@example.com");
        ResetPasswordRequest reset = new ResetPasswordRequest();
        reset.setEmail("reset2@example.com");
        reset.setCode(lastCode("reset2@example.com"));
        reset.setPassword("newsecret456");
        authService.resetPassword(reset);
        reset.setPassword("another789x");
        assertThrows(ResponseStatusException.class, () -> authService.resetPassword(reset));
    }
}
