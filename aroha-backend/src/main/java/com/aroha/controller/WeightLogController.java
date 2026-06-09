package com.aroha.controller;

import com.aroha.model.User;
import com.aroha.model.WeightLog;
import com.aroha.repository.WeightLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weight-logs")
@RequiredArgsConstructor
public class WeightLogController {

    private final WeightLogRepository weightLogRepository;

    @PostMapping
    public ResponseEntity<WeightLog> logWeight(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        double kg = ((Number) body.get("weightKg")).doubleValue();
        LocalDate today = LocalDate.now();
        WeightLog log = weightLogRepository.findByUserIdAndLoggedDate(user.getId(), today)
                .map(existing -> {
                    existing.setWeightKg(kg);
                    return existing;
                })
                .orElse(WeightLog.builder()
                        .userId(user.getId())
                        .weightKg(kg)
                        .loggedDate(today)
                        .build());
        return ResponseEntity.ok(weightLogRepository.save(log));
    }

    @GetMapping("/history")
    public ResponseEntity<List<WeightLog>> history(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30") int days) {
        LocalDate cutoff = LocalDate.now().minusDays(days);
        return ResponseEntity.ok(
                weightLogRepository.findByUserIdAndLoggedDateAfterOrderByLoggedDateAsc(user.getId(), cutoff));
    }
}
