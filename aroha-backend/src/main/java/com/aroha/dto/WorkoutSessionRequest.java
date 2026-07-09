package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;

@Data
public class WorkoutSessionRequest {
    @NotBlank
    private String workoutType;

    @PositiveOrZero
    private int plannedMinutes;

    @PositiveOrZero
    private int actualSeconds;

    @PositiveOrZero
    private int exercisesCompleted;

    @PositiveOrZero
    private int totalSets;

    private List<String> exerciseNames;
}
