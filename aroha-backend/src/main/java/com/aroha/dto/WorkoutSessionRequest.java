package com.aroha.dto;

import lombok.Data;

import java.util.List;

@Data
public class WorkoutSessionRequest {
    private String workoutType;
    private int plannedMinutes;
    private int actualSeconds;
    private int exercisesCompleted;
    private int totalSets;
    private List<String> exerciseNames;
}
