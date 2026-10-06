package com.aroha.controller;

import com.aroha.model.User;
import com.aroha.service.AccountService;
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

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> export(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(accountService.exportData(user));
    }

    // POST rather than DELETE so the password can travel in a JSON body.
    @PostMapping("/delete")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        accountService.deleteAccount(user, body.get("password"));
        return ResponseEntity.noContent().build();
    }
}
