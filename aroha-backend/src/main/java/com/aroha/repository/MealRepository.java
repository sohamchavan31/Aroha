package com.aroha.repository;

import com.aroha.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MealRepository extends JpaRepository<Meal, Long> {

    List<Meal> findByNameContainingIgnoreCaseOrNameHindiContainingIgnoreCase(String name, String nameHindi);

    @Query("SELECT m FROM Meal m WHERE " +
           "(LOWER(m.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(m.nameHindi) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (m.isCustom = false OR m.createdBy = :userId)")
    List<Meal> searchWithCustom(@Param("q") String q, @Param("userId") Long userId);

    List<Meal> findByCategory(String category);

    List<Meal> findByRegion(String region);
}
