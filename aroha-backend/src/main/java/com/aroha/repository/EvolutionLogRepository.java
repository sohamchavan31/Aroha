package com.aroha.repository;

import org.springframework.transaction.annotation.Transactional;
import com.aroha.model.EvolutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvolutionLogRepository extends JpaRepository<EvolutionLog, Long> {
    List<EvolutionLog> findByUserIdOrderByStagedUpAtDesc(Long userId);

    List<EvolutionLog> findByUserId(Long userId);

    @Transactional
    void deleteByUserId(Long userId);
}
