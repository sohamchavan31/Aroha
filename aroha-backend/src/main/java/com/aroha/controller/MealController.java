package com.aroha.controller;

import com.aroha.model.Meal;
import com.aroha.repository.MealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealRepository mealRepository;

    @GetMapping("/search")
    public ResponseEntity<List<Meal>> search(@RequestParam String q) {
        return ResponseEntity.ok(
                mealRepository.findByNameContainingIgnoreCaseOrNameHindiContainingIgnoreCase(q, q)
        );
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Meal>> byCategory(@PathVariable String category) {
        return ResponseEntity.ok(mealRepository.findByCategory(category));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Meal>> all() {
        return ResponseEntity.ok(mealRepository.findAll());
    }
}
