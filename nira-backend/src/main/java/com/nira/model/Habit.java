package com.nira.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    // hex color for the habit chip e.g. "#E2B714"
    @Column(nullable = false)
    private String color;

    // Ionicons name e.g. "fitness-outline", "book-outline"
    private String icon;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
