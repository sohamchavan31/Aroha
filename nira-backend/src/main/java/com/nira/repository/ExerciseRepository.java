package com.nira.repository;

import com.nira.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findByCategory(String category);

    List<Exercise> findByEquipment(String equipment);

    List<Exercise> findByNameContainingIgnoreCase(String name);
}
