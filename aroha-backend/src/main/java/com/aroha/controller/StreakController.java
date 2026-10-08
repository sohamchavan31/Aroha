package com.aroha.controller;

import com.aroha.dto.ThawRequest;
import com.aroha.model.User;
import com.aroha.service.StreakService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/streak")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;

    /** Thaw a frozen streak with the extra push-ups / pull-ups. */
    @PostMapping("/thaw")
    public ResponseEntity<Map<String, Object>> thaw(@AuthenticationPrincipal User user,
                                                    @Valid @RequestBody ThawRequest request) {
        return ResponseEntity.ok(streakService.thaw(user, request));
    }
}
