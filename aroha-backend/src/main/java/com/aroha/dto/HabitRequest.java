package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HabitRequest {

    @NotBlank(message = "Habit name is required")
    private String name;

    @NotBlank(message = "Color is required")
    private String color;

    private String icon;
}
