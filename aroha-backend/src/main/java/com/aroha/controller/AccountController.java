package com.aroha.controller;

import com.aroha.dto.VerifyEmailRequest;
import com.aroha.model.User;
import com.aroha.service.AccountService;
import com.aroha.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AuthService authService;

    /** Emails a new verification code (no-op once verified). */
    @PostMapping("/email/send-code")
    public ResponseEntity<Void> sendEmailCode(@AuthenticationPrincipal User user) {
        authService.sendVerification(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/verify")
    public ResponseEntity<Map<String, Object>> verifyEmail(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(user, request.getCode());
        return ResponseEntity.ok(Map.of("emailVerified", true));
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> export(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(accountService.exportData(user));
    }

    // POST rather than DELETE so the password can travel in a JSON body.
    @PostMapping("/delete")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        accountService.deleteAccount(user, body.get("password"), body.get("confirm"));
        return ResponseEntity.noContent().build();
    }
}
