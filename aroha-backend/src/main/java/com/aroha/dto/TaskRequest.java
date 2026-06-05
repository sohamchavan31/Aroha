package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    // ISO date string e.g. "2026-05-30" — defaults to today if null
    private String taskDate;

    // "07:00" format — null means unscheduled
    private String scheduledTime;

    private Long linkedHabitId;
}
