package com.aroha.controller;

import com.aroha.dto.WorkoutPlanRequest;
import com.aroha.dto.WorkoutPlanResponse;
import com.aroha.dto.WorkoutSessionRequest;
import com.aroha.model.User;
import com.aroha.model.WorkoutSession;
import com.aroha.repository.WorkoutSessionRepository;
import com.aroha.service.WorkoutGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workout")
@RequiredArgsConstructor
public class WorkoutGeneratorController {

    // MET (metabolic equivalent) values per workout type — used to estimate calories burned
    private static final Map<String, Double> MET_VALUES = Map.of(
            "PUSH",      5.0,
            "PULL",      5.0,
            "LEGS",      6.0,
            "FULL_BODY", 6.0,
            "CROSSFIT",  8.0,
            "CARDIO",    8.0,
            "YOGA",      3.0,
            "CORE",      4.0
    );
    private static final double DEFAULT_MET = 5.0;
    private static final double DEFAULT_WEIGHT_KG = 70.0;

    private final WorkoutGeneratorService workoutGeneratorService;
    private final WorkoutSessionRepository workoutSessionRepository;

    @PostMapping("/generate")
    public ResponseEntity<WorkoutPlanResponse> generate(@RequestBody WorkoutPlanRequest request) {
        return ResponseEntity.ok(workoutGeneratorService.generate(request));
    }

    @PostMapping("/sessions")
    public ResponseEntity<WorkoutSession> saveSession(
            @AuthenticationPrincipal User user,
            @RequestBody WorkoutSessionRequest req) {
        double met = MET_VALUES.getOrDefault(req.getWorkoutType(), DEFAULT_MET);
        double weightKg = user.getWeightKg() != null ? user.getWeightKg() : DEFAULT_WEIGHT_KG;
        double hours = req.getActualSeconds() / 3600.0;
        double caloriesBurned = Math.round(met * weightKg * hours * 10.0) / 10.0;

        WorkoutSession session = WorkoutSession.builder()
                .userId(user.getId())
                .workoutType(req.getWorkoutType())
                .plannedMinutes(req.getPlannedMinutes())
                .actualSeconds(req.getActualSeconds())
                .exercisesCompleted(req.getExercisesCompleted())
                .totalSets(req.getTotalSets())
                .exerciseNames(req.getExerciseNames() != null
                        ? String.join(", ", req.getExerciseNames()) : "")
                .caloriesBurned(caloriesBurned)
                .completedAt(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutSessionRepository.save(session));
    }

    @GetMapping("/sessions/recent")
    public ResponseEntity<List<WorkoutSession>> recentSessions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                workoutSessionRepository.findTop5ByUserIdOrderByCompletedAtDesc(user.getId()));
    }
}
