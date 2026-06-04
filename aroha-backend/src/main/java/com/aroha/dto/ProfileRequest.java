package com.aroha.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileRequest {

    @NotNull
    @Min(10) @Max(100)
    private Integer age;

    @NotNull
    @Min(20) @Max(300)
    private Double weightKg;

    @NotNull
    @Min(50) @Max(250)
    private Double heightCm;

    @NotBlank
    private String healthGoal;

    @Min(4) @Max(20)
    private Integer waterGoalGlasses;
}
