package com.aroha.repository;

import com.aroha.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserIdAndTaskDateOrderByScheduledTimeAscCreatedAtAsc(Long userId, LocalDate date);

    List<Task> findByUserIdAndTaskDateAndCompleted(Long userId, LocalDate date, boolean completed);
}
