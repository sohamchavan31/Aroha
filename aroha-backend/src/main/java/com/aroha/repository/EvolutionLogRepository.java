package com.aroha.repository;

import com.aroha.model.EvolutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvolutionLogRepository extends JpaRepository<EvolutionLog, Long> {
    List<EvolutionLog> findByUserIdOrderByStagedUpAtDesc(Long userId);
}
