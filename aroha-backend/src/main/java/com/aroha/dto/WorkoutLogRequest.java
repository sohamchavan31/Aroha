package com.aroha.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WorkoutLogRequest {

    @NotNull
    private Long exerciseId;

    @Min(1)
    private int sets;

    @Min(1)
    private int reps;

    private double weightKg;
}
