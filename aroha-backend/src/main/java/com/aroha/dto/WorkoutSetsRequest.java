package com.aroha.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/** One exercise, several sets — each with its own weight and reps. */
@Data
public class WorkoutSetsRequest {

    @NotNull
    private Long exerciseId;

    @NotEmpty(message = "Add at least one set")
    @Size(max = 20, message = "20 sets at most")
    private List<@Valid SetEntry> sets;

    @Data
    public static class SetEntry {
        @Min(value = 1, message = "Reps must be at least 1")
        @Max(value = 200, message = "Reps must be 200 or fewer")
        private int reps;

        @DecimalMin(value = "0", message = "Weight can't be negative")
        @DecimalMax(value = "500", message = "Weight must be 500 kg or less")
        private double weightKg;
    }
}
