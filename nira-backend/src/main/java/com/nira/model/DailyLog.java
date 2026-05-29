package com.nira.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long mealId;

    @Column(nullable = false)
    private String mealName;

    // how many grams the user actually ate
    @Column(nullable = false)
    private double servingGrams;

    // pre-calculated macros for this serving (so we don't need joins for totals)
    private double calories;
    private double protein;
    private double carbs;
    private double fat;

    @Column(nullable = false)
    private LocalDate logDate;

    @CreationTimestamp
    private LocalDateTime loggedAt;
}
