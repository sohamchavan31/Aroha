package com.nira.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "sleep_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "log_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    // e.g. "23:00"
    private String sleepTime;

    // e.g. "06:30"
    private String wakeTime;

    // 1 = terrible, 5 = amazing
    private int qualityRating;

    // calculated on save: hours between sleepTime and wakeTime
    private double durationHours;
}
