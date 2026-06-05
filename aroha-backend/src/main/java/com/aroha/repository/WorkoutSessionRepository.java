package com.aroha.repository;

import com.aroha.model.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findTop5ByUserIdOrderByCompletedAtDesc(Long userId);
}
