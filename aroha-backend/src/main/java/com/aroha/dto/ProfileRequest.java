package com.aroha.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileRequest {

    @NotBlank
    private String gender;              // male | female | other

    @NotNull
    @Min(10) @Max(100)
    private Integer age;

    @NotNull
    @Min(20) @Max(300)
    private Double weightKg;

    @Min(20) @Max(300)
    private Double targetWeightKg;      // optional

    @NotNull
    @Min(50) @Max(250)
    private Double heightCm;

    @NotBlank
    private String activityLevel;       // sedentary | lightly_active | moderately_active | very_active | athlete

    @NotBlank
    private String healthGoal;

    private String weightChangeSpeed;   // slow_cut | moderate_cut | aggressive_cut | slow_bulk | lean_bulk | aggressive_bulk

    private String experienceLevel;     // beginner | intermediate | advanced

    private String dietaryPreference;   // vegetarian | eggetarian | non_vegetarian | vegan | jain

    @Min(4) @Max(20)
    private Integer waterGoalGlasses;
}
