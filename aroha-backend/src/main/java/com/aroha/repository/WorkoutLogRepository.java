package com.aroha.repository;

import com.aroha.model.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {

    List<WorkoutLog> findByUserIdAndLogDateOrderByLoggedAtAsc(Long userId, LocalDate date);

    List<WorkoutLog> findByUserIdOrderByLogDateDescLoggedAtDesc(Long userId);

    List<WorkoutLog> findByUserIdAndExerciseIdOrderByLogDateAscLoggedAtAsc(Long userId, Long exerciseId);
}
