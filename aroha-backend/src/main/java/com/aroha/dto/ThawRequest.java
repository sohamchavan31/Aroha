package com.aroha.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ThawRequest {
    @NotBlank
    @Pattern(regexp = "pushups|pullups", message = "Choose push-ups or pull-ups")
    private String exercise;

    @Min(value = 1, message = "Count at least one rep")
    @Max(value = 500, message = "That's more reps than we can count")
    private int reps;
}
