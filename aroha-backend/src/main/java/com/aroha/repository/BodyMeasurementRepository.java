package com.aroha.repository;

import com.aroha.model.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    Optional<BodyMeasurement> findByUserIdAndLogDate(Long userId, LocalDate logDate);

    List<BodyMeasurement> findByUserIdOrderByLogDateDesc(Long userId);

    @Transactional
    void deleteByUserId(Long userId);
}
