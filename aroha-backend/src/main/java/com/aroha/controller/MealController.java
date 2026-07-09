package com.aroha.controller;

import com.aroha.dto.CustomMealRequest;
import com.aroha.model.Meal;
import com.aroha.model.User;
import com.aroha.repository.MealRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealRepository mealRepository;

    @GetMapping("/search")
    public ResponseEntity<List<Meal>> search(
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        if (user == null) {
            return ResponseEntity.ok(
                    mealRepository.findByNameContainingIgnoreCaseOrNameHindiContainingIgnoreCase(q, q));
        }
        return ResponseEntity.ok(mealRepository.searchWithCustom(q, user.getId()));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Meal>> byCategory(@PathVariable String category) {
        return ResponseEntity.ok(mealRepository.findByCategory(category));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Meal>> all() {
        return ResponseEntity.ok(mealRepository.findAll());
    }

    @PostMapping("/custom")
    public ResponseEntity<Meal> createCustom(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CustomMealRequest req) {
        Meal meal = Meal.builder()
                .name(req.getName())
                .category(req.getCategory() != null ? req.getCategory() : "custom")
                .region("custom")
                .caloriesPer100g(req.getCaloriesPer100g())
                .proteinPer100g(req.getProteinPer100g())
                .carbsPer100g(req.getCarbsPer100g())
                .fatPer100g(req.getFatPer100g())
                .fiberPer100g(req.getFiberPer100g())
                .servingUnit(req.getServingUnit() != null ? req.getServingUnit() : "grams")
                .typicalServing(req.getTypicalServing() > 0 ? req.getTypicalServing() : 100)
                .isCustom(true)
                .createdBy(user.getId())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(mealRepository.save(meal));
    }
}
