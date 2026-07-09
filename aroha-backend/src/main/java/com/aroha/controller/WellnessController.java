package com.aroha.controller;

import com.aroha.model.SleepLog;
import com.aroha.model.User;
import com.aroha.model.WaterLog;
import com.aroha.repository.SleepLogRepository;
import com.aroha.repository.WaterLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/wellness")
@RequiredArgsConstructor
public class WellnessController {

    private final WaterLogRepository waterLogRepository;
    private final SleepLogRepository sleepLogRepository;

    // ── Water ─────────────────────────────────────────────────────────────────

    @GetMapping("/water/today")
    public ResponseEntity<WaterLog> getWaterToday(@AuthenticationPrincipal User user) {
        WaterLog log = waterLogRepository
                .findByUserIdAndLogDate(user.getId(), LocalDate.now())
                .orElse(WaterLog.builder()
                        .userId(user.getId())
                        .logDate(LocalDate.now())
                        .glasses(0)
                        .dailyGoal(8)
                        .build());
        return ResponseEntity.ok(log);
    }

    @PostMapping("/water/add")
    public ResponseEntity<WaterLog> addGlass(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "8") int goal) {

        WaterLog log = waterLogRepository
                .findByUserIdAndLogDate(user.getId(), LocalDate.now())
                .orElse(WaterLog.builder()
                        .userId(user.getId())
                        .logDate(LocalDate.now())
                        .glasses(0)
                        .dailyGoal(goal)
                        .build());

        log.setGlasses(log.getGlasses() + 1);
        return ResponseEntity.ok(waterLogRepository.save(log));
    }

    @PostMapping("/water/remove")
    public ResponseEntity<WaterLog> removeGlass(@AuthenticationPrincipal User user) {
        WaterLog log = waterLogRepository
                .findByUserIdAndLogDate(user.getId(), LocalDate.now())
                .orElse(WaterLog.builder()
                        .userId(user.getId())
                        .logDate(LocalDate.now())
                        .glasses(0)
                        .dailyGoal(8)
                        .build());

        log.setGlasses(Math.max(0, log.getGlasses() - 1));
        return ResponseEntity.ok(waterLogRepository.save(log));
    }

    @PostMapping("/water/goal")
    public ResponseEntity<WaterLog> updateGoal(
            @AuthenticationPrincipal User user,
            @RequestParam int goal) {

        WaterLog log = waterLogRepository
                .findByUserIdAndLogDate(user.getId(), LocalDate.now())
                .orElse(WaterLog.builder()
                        .userId(user.getId())
                        .logDate(LocalDate.now())
                        .glasses(0)
                        .dailyGoal(goal)
                        .build());

        log.setDailyGoal(goal);
        return ResponseEntity.ok(waterLogRepository.save(log));
    }

    // ── Sleep ─────────────────────────────────────────────────────────────────

    @GetMapping("/sleep/today")
    public ResponseEntity<SleepLog> getSleepToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                sleepLogRepository.findByUserIdAndLogDate(user.getId(), LocalDate.now())
                        .orElse(null)
        );
    }

    @PostMapping("/sleep")
    public ResponseEntity<SleepLog> logSleep(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {

        Object sleepTimeValue = body.get("sleepTime");
        Object wakeTimeValue  = body.get("wakeTime");
        Object qualityValue   = body.get("qualityRating");

        if (!(sleepTimeValue instanceof String) || !(wakeTimeValue instanceof String)
                || !(qualityValue instanceof Number)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sleepTime, wakeTime and qualityRating are required");
        }

        String sleepTime  = (String) sleepTimeValue;
        String wakeTime   = (String) wakeTimeValue;
        int qualityRating = ((Number) qualityValue).intValue();

        if (qualityRating < 1 || qualityRating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "qualityRating must be between 1 and 5");
        }

        double duration = calcDuration(sleepTime, wakeTime);

        SleepLog log = sleepLogRepository
                .findByUserIdAndLogDate(user.getId(), LocalDate.now())
                .orElse(SleepLog.builder()
                        .userId(user.getId())
                        .logDate(LocalDate.now())
                        .build());

        log.setSleepTime(sleepTime);
        log.setWakeTime(wakeTime);
        log.setQualityRating(qualityRating);
        log.setDurationHours(duration);

        return ResponseEntity.ok(sleepLogRepository.save(log));
    }

    private double calcDuration(String sleepTime, String wakeTime) {
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime sleep = LocalTime.parse(sleepTime, fmt);
            LocalTime wake  = LocalTime.parse(wakeTime, fmt);
            int mins = wake.toSecondOfDay() - sleep.toSecondOfDay();
            if (mins < 0) mins += 24 * 3600;
            return Math.round((mins / 3600.0) * 10.0) / 10.0;
        } catch (Exception e) {
            return 0;
        }
    }
}
