package com.aroha.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkoutExerciseDto {
    private Long   id;
    private String name;
    private String category;
    private String muscleGroup;
    private int    sets;
    private int    reps;
    private int    restSeconds;
    private int    estimatedSeconds;
}
