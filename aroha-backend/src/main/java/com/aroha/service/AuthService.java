package com.aroha.service;

import com.aroha.dto.AuthResponse;
import com.aroha.dto.LoginRequest;
import com.aroha.dto.RegisterRequest;
import com.aroha.dto.ResetPasswordRequest;
import com.aroha.model.EmailCode.Purpose;
import com.aroha.model.User;
import com.aroha.repository.RefreshTokenRepository;
import com.aroha.repository.UserRepository;
import com.aroha.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailCodeService emailCodeService;

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName().trim())
                .evolutionStage("Spark")
                .evolutionPoints(0)
                .streak(0)
                .profileComplete(false)
                .emailVerified(false)
                .build();

        userRepository.save(user);
        try {
            emailCodeService.send(user, Purpose.VERIFY);
        } catch (ResponseStatusException e) {
            // The account exists either way; the app's "Resend code" tries again.
            log.warn("Verification email not sent for new user {}", user.getId());
        }
        return authResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return authResponse(user);
    }

    /** New access token + rotated refresh token, from a refresh token. */
    public AuthResponse refresh(String refreshToken) {
        Long userId = refreshTokenService.consume(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again"));
        return authResponse(user);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /** Emails a new verification code to a signed-in user who hasn't verified yet. */
    public void sendVerification(User principal) {
        User user = current(principal);
        if (!user.isEmailVerified()) {
            emailCodeService.send(user, Purpose.VERIFY);
        }
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void verifyEmail(User principal, String code) {
        User user = current(principal);
        if (user.isEmailVerified()) return;
        emailCodeService.check(user, Purpose.VERIFY, code);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /**
     * Emails a reset code if the address has an account. The answer is the same
     * either way, so this can't be used to find out who has an account.
     */
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .filter(user -> emailCodeService.canResend(user, Purpose.RESET))
                .ifPresent(user -> emailCodeService.send(user, Purpose.RESET));
    }

    /** Sets a new password from an emailed code, signs out every device, and signs this one in. */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "This code has expired. Ask for a new one."));
        emailCodeService.check(user, Purpose.RESET, request.getCode());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(true); // they just proved they read this inbox
        userRepository.save(user);
        refreshTokenRepository.deleteByUserId(user.getId());
        return authResponse(user);
    }

    private User current(User principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again"));
    }

    private AuthResponse authResponse(User user) {
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user.getEmail()))
                .refreshToken(refreshTokenService.issue(user))
                .name(user.getName())
                .evolutionStage(user.getEvolutionStage())
                .evolutionPoints(user.getEvolutionPoints())
                .profileComplete(user.getProfileComplete())
                .emailVerified(user.isEmailVerified())
                .build();
    }

    // Emails are case-insensitive in practice: store and look them up trimmed and lower-cased.
    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
