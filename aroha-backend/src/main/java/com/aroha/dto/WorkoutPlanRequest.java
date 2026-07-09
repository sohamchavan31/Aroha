package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WorkoutPlanRequest {
    @Positive
    private int durationMinutes;  // 30 / 45 / 60 / 90 / 120

    @NotBlank
    private String workoutType;   // PUSH / PULL / LEGS / CARDIO / FULL_BODY / CROSSFIT / YOGA / CORE
}
