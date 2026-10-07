package com.aroha.controller;

import com.aroha.service.ActivityService;
import com.aroha.dto.WorkoutLogRequest;
import com.aroha.dto.WorkoutSetsRequest;
import com.aroha.model.Exercise;
import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import com.aroha.repository.ExerciseRepository;
import com.aroha.service.WorkoutService;
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
    private final ActivityService activityService;

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
        WorkoutLog saved = workoutService.logExercise(user, request);
        activityService.recordActivity(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Several sets of one exercise, each with its own weight and reps.
    @PostMapping("/log/sets")
    public ResponseEntity<Map<String, Object>> logSets(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WorkoutSetsRequest request) {
        Map<String, Object> saved = workoutService.logSets(user, request);
        activityService.recordActivity(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getTodayWorkout(user));
    }

    @GetMapping("/history/{exerciseId}")
    public ResponseEntity<Map<String, Object>> exerciseHistory(
            @AuthenticationPrincipal User user,
            @PathVariable Long exerciseId) {
        return ResponseEntity.ok(workoutService.getExerciseHistory(user, exerciseId));
    }

    @DeleteMapping("/log/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        workoutService.deleteEntry(user, id);
        return ResponseEntity.noContent().build();
    }
}
