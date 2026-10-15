package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/** One day's tape measurements, in cm. Any of them may be left out. */
@Entity
@Table(name = "body_measurements",
       uniqueConstraints = @UniqueConstraint(name = "body_measurements_user_date_key", columnNames = {"user_id", "log_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BodyMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "waist_cm")    private Double waistCm;
    @Column(name = "neck_cm")     private Double neckCm;
    @Column(name = "hip_cm")      private Double hipCm;
    @Column(name = "chest_cm")    private Double chestCm;
    @Column(name = "arm_cm")      private Double armCm;
    @Column(name = "shoulder_cm") private Double shoulderCm;
    @Column(name = "thigh_cm")    private Double thighCm;
}
