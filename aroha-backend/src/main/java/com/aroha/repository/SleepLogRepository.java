package com.aroha.repository;

import com.aroha.model.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {

    Optional<SleepLog> findByUserIdAndLogDate(Long userId, LocalDate date);

    List<SleepLog> findByUserIdAndLogDateBetweenOrderByLogDateAsc(Long userId, LocalDate start, LocalDate end);
}
