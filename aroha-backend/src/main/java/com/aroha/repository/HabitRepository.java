package com.aroha.repository;

import org.springframework.transaction.annotation.Transactional;
import com.aroha.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);
    long countByUserId(Long userId);

    List<Habit> findByUserId(Long userId);

    @Transactional
    void deleteByUserId(Long userId);
}
