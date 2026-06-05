package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    // DAILY or WEEKLY
    @Column(nullable = false)
    private String type;

    // STRENGTH / DISCIPLINE / RECOVERY / NUTRITION
    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int epReward;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private LocalDate missionDate;

    private LocalDateTime completedAt;
}
