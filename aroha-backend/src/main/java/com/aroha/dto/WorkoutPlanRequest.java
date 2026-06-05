package com.aroha.dto;

import lombok.Data;

@Data
public class WorkoutPlanRequest {
    private int durationMinutes;  // 30 / 45 / 60 / 90 / 120
    private String workoutType;   // PUSH / PULL / LEGS / CARDIO / FULL_BODY / CROSSFIT / YOGA / CORE
}
