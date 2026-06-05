package com.aroha.repository;

import com.aroha.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByUserIdAndMissionDate(Long userId, LocalDate date);

    List<Mission> findByUserIdAndMissionDateBetween(Long userId, LocalDate start, LocalDate end);
}
