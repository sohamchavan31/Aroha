package com.nira.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String rank;

    @Column(nullable = false)
    private int totalXp;

    @Column(nullable = false)
    private int streak;

    // ── Health profile (set during onboarding) ───────────────────────────────
    private Integer age;
    private Double weightKg;
    private Double heightCm;

    // lose_weight | gain_muscle | stay_fit | improve_flexibility
    private String healthGoal;

    private Integer waterGoalGlasses;

    @Column(nullable = false)
    @Builder.Default
    private boolean profileComplete = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
