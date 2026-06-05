package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "evolution_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvolutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fromStage;

    @Column(nullable = false)
    private String toStage;

    @Column(nullable = false)
    private int epAtStageUp;

    @Column(nullable = false)
    private LocalDateTime stagedUpAt;
}
