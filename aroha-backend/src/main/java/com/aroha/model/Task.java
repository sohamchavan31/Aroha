package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate taskDate;

    // e.g. "07:00", "14:30" — null means unscheduled (to-do list)
    private String scheduledTime;

    @Column(nullable = false)
    private boolean completed;

    // true if this task was not done yesterday and carried forward to today
    @Column(nullable = false)
    private boolean carriedForward;

    // optional link to a habit — completing this task can auto-check the habit
    private Long linkedHabitId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
