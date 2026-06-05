package com.aroha.repository;

import com.aroha.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);
}
