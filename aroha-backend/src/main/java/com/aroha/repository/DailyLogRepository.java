package com.aroha.repository;

import com.aroha.model.DailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface DailyLogRepository extends JpaRepository<DailyLog, Long> {

    List<DailyLog> findByUserIdAndLogDateOrderByLoggedAtAsc(Long userId, LocalDate date);

    @Query("SELECT COALESCE(SUM(d.calories), 0) FROM DailyLog d WHERE d.userId = :userId AND d.logDate = :date")
    double sumCaloriesByUserIdAndDate(Long userId, LocalDate date);
}
