package com.aroha.repository;

import com.aroha.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MealRepository extends JpaRepository<Meal, Long> {

    List<Meal> findByNameContainingIgnoreCaseOrNameHindiContainingIgnoreCase(String name, String nameHindi);

    List<Meal> findByCategory(String category);

    List<Meal> findByRegion(String region);
}
