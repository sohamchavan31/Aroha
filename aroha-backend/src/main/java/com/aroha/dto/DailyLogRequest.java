package com.aroha.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DailyLogRequest {

    @NotNull
    private Long mealId;

    @Min(value = 1, message = "Serving must be at least 1 gram")
    private double servingGrams;
}
