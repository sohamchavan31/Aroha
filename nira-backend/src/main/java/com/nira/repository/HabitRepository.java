package com.nira.repository;

import com.nira.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);
}
