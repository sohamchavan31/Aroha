package com.aroha.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WorkoutPlanResponse {
    private String                  workoutType;
    private int                     requestedMinutes;
    private int                     estimatedMinutes;
    private List<WorkoutExerciseDto> exercises;
}
