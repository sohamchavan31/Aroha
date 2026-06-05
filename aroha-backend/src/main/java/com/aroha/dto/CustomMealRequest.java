package com.aroha.dto;

import lombok.Data;

@Data
public class CustomMealRequest {
    private String name;
    private String category;
    private double caloriesPer100g;
    private double proteinPer100g;
    private double carbsPer100g;
    private double fatPer100g;
    private double fiberPer100g;
    private String servingUnit;
    private double typicalServing;
}
