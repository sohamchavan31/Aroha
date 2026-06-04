package com.aroha.controller;

import com.aroha.dto.HabitRequest;
import com.aroha.model.Habit;
import com.aroha.model.User;
import com.aroha.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<Habit> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody HabitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(habitService.createHabit(user, request));
    }

    @GetMapping
    public ResponseEntity<List<Habit>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(habitService.getUserHabits(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        habitService.deleteHabit(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean completed = habitService.toggle(user, id, date);
        return ResponseEntity.ok(Map.of("completed", completed));
    }

    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Object>> monthly(
            @AuthenticationPrincipal User user,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(habitService.getMonthlyView(user, year, month));
    }
}
