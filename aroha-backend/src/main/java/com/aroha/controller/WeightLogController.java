package com.aroha.controller;

import com.aroha.repository.UserRepository;
import com.aroha.service.ActivityService;
import com.aroha.service.MacroCalculator;
import com.aroha.model.User;
import com.aroha.model.WeightLog;
import com.aroha.repository.WeightLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weight-logs")
@RequiredArgsConstructor
public class WeightLogController {

    private final WeightLogRepository weightLogRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<WeightLog> logWeight(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Object weightKgValue = body.get("weightKg");
        if (!(weightKgValue instanceof Number)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weightKg is required");
        }
        double kg = ((Number) weightKgValue).doubleValue();
        if (kg <= 0 || kg > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weightKg must be between 0 and 500");
        }
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
        WeightLog saved = weightLogRepository.save(log);

        // Today's weigh-in is the user's current weight: update it and the targets built on it.
        user.setWeightKg(kg);
        MacroCalculator.apply(user);
        userRepository.save(user);
        activityService.recordActivity(user);
        return ResponseEntity.ok(saved);
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
