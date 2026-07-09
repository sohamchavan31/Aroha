package com.aroha.model;

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
    private String evolutionStage;

    @Column(nullable = false)
    private int evolutionPoints;

    @Column(nullable = false)
    private int streak;

    // ── Health profile (set during onboarding) ───────────────────────────────
    private String gender;              // male | female | other
    private Integer age;
    private Double weightKg;
    private Double targetWeightKg;
    private Double heightCm;
    private String activityLevel;       // sedentary | lightly_active | moderately_active | very_active | athlete
    private String healthGoal;
    private String weightChangeSpeed;   // slow_cut | moderate_cut | aggressive_cut | slow_bulk | lean_bulk | aggressive_bulk
    private String experienceLevel;     // beginner | intermediate | advanced
    private String dietaryPreference;   // vegetarian | eggetarian | non_vegetarian | vegan | jain
    private Integer waterGoalGlasses;

    // ── Stored macro targets (computed on save, used by macro screen + AI) ──
    private Integer dailyCalorieGoal;
    private Integer dailyProteinGoal;
    private Integer dailyCarbGoal;
    private Integer dailyFatGoal;

    private Boolean profileComplete;

    // Key into the mobile app's preset avatar list (e.g. "flame-gold"); null = default
    private String avatarKey;

    // ── Health Attributes (0–100) ────────────────────────────────────────────
    @Column(columnDefinition = "integer default 0")
    private int strengthAttr;

    @Column(columnDefinition = "integer default 0")
    private int disciplineAttr;

    @Column(columnDefinition = "integer default 0")
    private int recoveryAttr;

    @Column(columnDefinition = "integer default 0")
    private int nutritionAttr;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
