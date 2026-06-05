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

@RestController
@RequestMapping("/api/workout")
@RequiredArgsConstructor
public class WorkoutGeneratorController {

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
        WorkoutSession session = WorkoutSession.builder()
                .userId(user.getId())
                .workoutType(req.getWorkoutType())
                .plannedMinutes(req.getPlannedMinutes())
                .actualSeconds(req.getActualSeconds())
                .exercisesCompleted(req.getExercisesCompleted())
                .totalSets(req.getTotalSets())
                .exerciseNames(req.getExerciseNames() != null
                        ? String.join(", ", req.getExerciseNames()) : "")
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
