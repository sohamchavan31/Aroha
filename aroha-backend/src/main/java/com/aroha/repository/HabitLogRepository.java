package com.aroha.repository;

import com.aroha.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

    List<HabitLog> findByUserIdAndLogDateBetween(Long userId, LocalDate start, LocalDate end);

    Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate date);
}
