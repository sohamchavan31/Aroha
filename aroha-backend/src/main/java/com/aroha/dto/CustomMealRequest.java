package com.aroha.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CustomMealRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String category;

    @DecimalMin("0")
    private double caloriesPer100g;

    @DecimalMin("0")
    private double proteinPer100g;

    @DecimalMin("0")
    private double carbsPer100g;

    @DecimalMin("0")
    private double fatPer100g;

    @DecimalMin("0")
    private double fiberPer100g;

    @NotBlank
    private String servingUnit;

    @Positive
    private double typicalServing;
}
