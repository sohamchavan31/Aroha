package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long exerciseId;

    @Column(nullable = false)
    private String exerciseName;

    private String category;

    private int sets;
    private int reps;

    // 0 for bodyweight exercises
    @Column(name = "weight_kg")
    private double weightKg;

    @Column(nullable = false)
    private LocalDate logDate;

    @CreationTimestamp
    private LocalDateTime loggedAt;
}
