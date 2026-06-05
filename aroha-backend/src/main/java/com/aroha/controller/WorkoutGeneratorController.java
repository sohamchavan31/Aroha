package com.aroha.controller;

import com.aroha.dto.WorkoutPlanRequest;
import com.aroha.dto.WorkoutPlanResponse;
import com.aroha.service.WorkoutGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workout")
@RequiredArgsConstructor
public class WorkoutGeneratorController {

    private final WorkoutGeneratorService workoutGeneratorService;

    @PostMapping("/generate")
    public ResponseEntity<WorkoutPlanResponse> generate(@RequestBody WorkoutPlanRequest request) {
        return ResponseEntity.ok(workoutGeneratorService.generate(request));
    }
}
