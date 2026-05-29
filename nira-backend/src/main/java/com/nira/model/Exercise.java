package com.nira.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // strength, cardio, yoga, flexibility, hiit
    @Column(nullable = false)
    private String category;

    // none, dumbbell, mat, resistance_band, pullup_bar
    private String equipment;

    // chest, back, legs, shoulders, arms, core, full_body, cardio
    @Column(name = "muscle_group")
    private String muscleGroup;

    private String description;

    // default sets and reps to pre-fill the log form
    @Column(name = "default_sets")
    private int defaultSets;

    @Column(name = "default_reps")
    private int defaultReps;
}
