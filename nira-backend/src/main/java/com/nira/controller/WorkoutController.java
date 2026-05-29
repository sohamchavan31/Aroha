package com.nira.controller;

import com.nira.dto.WorkoutLogRequest;
import com.nira.model.Exercise;
import com.nira.model.User;
import com.nira.model.WorkoutLog;
import com.nira.repository.ExerciseRepository;
import com.nira.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;
    private final ExerciseRepository exerciseRepository;

    @GetMapping("/exercises")
    public ResponseEntity<List<Exercise>> getAllExercises() {
        return ResponseEntity.ok(exerciseRepository.findAll());
    }

    @GetMapping("/exercises/category/{category}")
    public ResponseEntity<List<Exercise>> byCategory(@PathVariable String category) {
        return ResponseEntity.ok(exerciseRepository.findByCategory(category));
    }

    @PostMapping("/log")
    public ResponseEntity<WorkoutLog> logExercise(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WorkoutLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.logExercise(user, request));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getTodayWorkout(user));
    }

    @DeleteMapping("/log/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        workoutService.deleteEntry(user, id);
        return ResponseEntity.noContent().build();
    }
}
