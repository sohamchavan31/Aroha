package com.aroha.service;

import com.aroha.model.EmailCode;
import com.aroha.model.EmailCode.Purpose;
import com.aroha.model.User;
import com.aroha.repository.EmailCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

/**
 * 6-digit codes sent by email. A code lasts 10 minutes and allows 5 tries;
 * asking for a new one replaces the old one, at most once a minute.
 */
@Service
@RequiredArgsConstructor
public class EmailCodeService {

    static final Duration TTL = Duration.ofMinutes(10);
    static final Duration RESEND_AFTER = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailCodeRepository repository;
    private final MailService mailService;

    /** Whether a new code may be sent now (the last one is at least a minute old). */
    public boolean canResend(User user, Purpose purpose) {
        return repository.findFirstByUserIdAndPurpose(user.getId(), purpose)
                .map(c -> c.getCreatedAt().plus(RESEND_AFTER).isBefore(Instant.now()))
                .orElse(true);
    }

    /** Replaces any live code for this purpose with a new one and emails it. */
    @Transactional
    public void send(User user, Purpose purpose) {
        if (!canResend(user, purpose)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Wait a minute before asking for a new code.");
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant now = Instant.now();
        repository.deleteByUserIdAndPurpose(user.getId(), purpose);
        repository.save(EmailCode.builder()
                .userId(user.getId())
                .purpose(purpose)
                .codeHash(hash(user.getId(), code))
                .attempts(0)
                .createdAt(now)
                .expiresAt(now.plus(TTL))
                .build());

        if (purpose == Purpose.VERIFY) {
            mailService.sendCode(user.getEmail(), code + " is your Aroha code",
                    "Hi " + user.getName() + ", here's the code to verify your email:", code,
                    "It expires in 10 minutes. If you didn't sign up for Aroha, you can ignore this email.");
        } else {
            mailService.sendCode(user.getEmail(), code + " is your Aroha password reset code",
                    "Use this code to set a new password for your Aroha account:", code,
                    "It expires in 10 minutes. If you didn't ask to reset your password, ignore this email; your password stays the same.");
        }
    }

    /**
     * Spends the code if it matches. A wrong guess counts towards the limit even
     * though the request fails, so the attempt counter is kept on error.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void check(User user, Purpose purpose, String code) {
        EmailCode stored = repository.findFirstByUserIdAndPurpose(user.getId(), purpose)
                .orElseThrow(() -> bad("This code has expired. Ask for a new one."));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            repository.delete(stored);
            throw bad("This code has expired. Ask for a new one.");
        }
        if (stored.getAttempts() >= MAX_ATTEMPTS) {
            throw bad("Too many wrong tries. Ask for a new code.");
        }
        String given = code == null ? "" : code.trim();
        boolean match = MessageDigest.isEqual(
                stored.getCodeHash().getBytes(StandardCharsets.UTF_8),
                hash(user.getId(), given).getBytes(StandardCharsets.UTF_8));
        if (!match) {
            stored.setAttempts(stored.getAttempts() + 1);
            repository.save(stored);
            int left = MAX_ATTEMPTS - stored.getAttempts();
            throw bad(left > 0 ? "That code isn't right. " + left + (left == 1 ? " try" : " tries") + " left."
                               : "Too many wrong tries. Ask for a new code.");
        }
        repository.delete(stored);
    }

    // 400, not 401/403: the app treats those as "session expired" and signs out.
    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    // Salted with the user id so the same code for two people hashes differently.
    private static String hash(Long userId, String code) {
        return RefreshTokenService.hash(userId + ":" + code);
    }
}
