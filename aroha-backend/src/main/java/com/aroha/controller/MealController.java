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
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealRepository mealRepository;

    /** Foods matching the query, best match first; includes the user's own foods. */
    @GetMapping("/search")
    public ResponseEntity<List<Meal>> search(
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        List<Meal> found = user == null
                ? mealRepository.findByNameContainingIgnoreCaseOrNameHindiContainingIgnoreCase(q, q)
                        .stream().filter(m -> !m.isCustom()).toList()
                : mealRepository.searchWithCustom(q, user.getId());
        return ResponseEntity.ok(rank(found, q));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Meal>> byCategory(@PathVariable String category) {
        // Reference foods only: other people's own foods are private.
        return ResponseEntity.ok(mealRepository.findByCategory(category).stream().filter(m -> !m.isCustom()).toList());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Meal>> all() {
        return ResponseEntity.ok(mealRepository.findAll().stream().filter(m -> !m.isCustom()).toList());
    }

    /** The foods this user added (from a label or as a recipe), A to Z. */
    @GetMapping("/mine")
    public ResponseEntity<List<Meal>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mealRepository.findByCreatedBy(user.getId()).stream()
                .sorted(Comparator.comparing(m -> m.getName().toLowerCase(Locale.ROOT)))
                .toList());
    }

    @PostMapping("/custom")
    public ResponseEntity<Meal> createCustom(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CustomMealRequest req) {
        Meal meal = Meal.builder()
                .region("custom")
                .isCustom(true)
                .createdBy(user.getId())
                .build();
        apply(meal, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(mealRepository.save(meal));
    }

    /** Edit one of your own foods. Meals already logged keep the values they were logged with. */
    @PutMapping("/custom/{id}")
    public ResponseEntity<Meal> updateCustom(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody CustomMealRequest req) {
        Meal meal = owned(user, id);
        apply(meal, req);
        return ResponseEntity.ok(mealRepository.save(meal));
    }

    @DeleteMapping("/custom/{id}")
    public ResponseEntity<Void> deleteCustom(@AuthenticationPrincipal User user, @PathVariable Long id) {
        mealRepository.delete(owned(user, id));
        return ResponseEntity.noContent().build();
    }

    private Meal owned(User user, Long id) {
        return mealRepository.findById(id)
                .filter(m -> m.isCustom() && user.getId().equals(m.getCreatedBy()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
    }

    private static void apply(Meal meal, CustomMealRequest req) {
        meal.setName(req.getName().trim());
        meal.setBrand(req.getBrand() != null && !req.getBrand().isBlank() ? req.getBrand().trim() : null);
        meal.setCategory(req.getCategory() != null ? req.getCategory() : "custom");
        meal.setCaloriesPer100g(req.getCaloriesPer100g());
        meal.setProteinPer100g(req.getProteinPer100g());
        meal.setCarbsPer100g(req.getCarbsPer100g());
        meal.setFatPer100g(req.getFatPer100g());
        meal.setFiberPer100g(req.getFiberPer100g());
        meal.setServingUnit(req.getServingUnit() != null ? req.getServingUnit() : "grams");
        meal.setTypicalServing(req.getTypicalServing() > 0 ? req.getTypicalServing() : 100);
    }

    /**
     * Order results so "paneer" lists your own paneers, then the plain paneers
     * (Regular, Low-fat, Malai), before dishes that merely contain paneer.
     * Groups: your foods where a word matches; exact name; name starting with
     * the query; a word starting with it; the rest. Shorter names first within a group.
     */
    static List<Meal> rank(List<Meal> meals, String query) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return meals.stream()
                .sorted(Comparator
                        .comparingInt((Meal m) -> matchRank(m, q))
                        .thenComparingInt(m -> m.getName().length())
                        .thenComparing(m -> m.getName().toLowerCase(Locale.ROOT)))
                .toList();
    }

    private static int matchRank(Meal m, String q) {
        String name = m.getName().toLowerCase(Locale.ROOT);
        String base = name.replaceAll("\\s*\\(.*\\)$", "");
        int rank;
        if (name.equals(q) || base.equals(q)) rank = 1;
        else if (name.startsWith(q)) rank = 2;
        else if (name.contains(" " + q) || name.contains("(" + q)) rank = 3;
        else rank = 4;
        String brand = m.getBrand() == null ? "" : m.getBrand().toLowerCase(Locale.ROOT);
        boolean brandMatch = brand.startsWith(q) || brand.contains(" " + q);
        return m.isCustom() && (rank <= 3 || brandMatch) ? 0 : rank;
    }
}
