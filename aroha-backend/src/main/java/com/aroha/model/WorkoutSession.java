package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String workoutType;

    private int plannedMinutes;
    private int actualSeconds;
    private int exercisesCompleted;
    private int totalSets;

    @Column(columnDefinition = "TEXT")
    private String exerciseNames;

    // estimated via MET formula: MET * weightKg * hours
    private double caloriesBurned;

    @Column(nullable = false)
    private LocalDateTime completedAt;
}
