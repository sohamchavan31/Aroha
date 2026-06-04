package com.aroha.controller;

import com.aroha.dto.DailyLogRequest;
import com.aroha.model.DailyLog;
import com.aroha.model.User;
import com.aroha.service.DailyLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class DailyLogController {

    private final DailyLogService dailyLogService;

    @PostMapping
    public ResponseEntity<DailyLog> addEntry(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DailyLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dailyLogService.addEntry(user, request));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dailyLogService.getTodayLog(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        dailyLogService.deleteEntry(user, id);
        return ResponseEntity.noContent().build();
    }
}
