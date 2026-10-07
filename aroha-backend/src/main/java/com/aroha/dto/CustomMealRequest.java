package com.aroha.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CustomMealRequest {
    @NotBlank
    @Size(max = 80, message = "Name must be 80 characters or fewer")
    private String name;

    @Size(max = 60, message = "Brand must be 60 characters or fewer")
    private String brand;

    @NotBlank
    private String category;

    @DecimalMin("0")
    @DecimalMax(value = "900", message = "Calories per 100 g can't be more than 900")
    private double caloriesPer100g;

    @DecimalMin("0")
    @DecimalMax(value = "100", message = "Macros per 100 g can't be more than 100 g")
    private double proteinPer100g;

    @DecimalMin("0")
    @DecimalMax(value = "100", message = "Macros per 100 g can't be more than 100 g")
    private double carbsPer100g;

    @DecimalMin("0")
    @DecimalMax(value = "100", message = "Macros per 100 g can't be more than 100 g")
    private double fatPer100g;

    @DecimalMin("0")
    @DecimalMax(value = "100", message = "Macros per 100 g can't be more than 100 g")
    private double fiberPer100g;

    @NotBlank
    private String servingUnit;

    @Positive
    private double typicalServing;
}
