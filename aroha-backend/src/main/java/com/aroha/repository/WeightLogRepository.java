package com.aroha.repository;

import com.aroha.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {
    Optional<WeightLog> findByUserIdAndLoggedDate(Long userId, LocalDate date);
    List<WeightLog> findByUserIdAndLoggedDateAfterOrderByLoggedDateAsc(Long userId, LocalDate after);
    Optional<WeightLog> findFirstByUserIdOrderByLoggedDateDesc(Long userId);
    Optional<WeightLog> findFirstByUserIdAndLoggedDateBeforeOrderByLoggedDateDesc(Long userId, LocalDate before);
}
