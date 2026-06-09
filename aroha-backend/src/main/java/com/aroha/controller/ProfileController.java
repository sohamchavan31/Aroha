package com.aroha.controller;

import com.aroha.dto.ProfileRequest;
import com.aroha.model.User;
import com.aroha.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildProfile(user));
    }

    @PatchMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProfileRequest request) {

        user.setGender(request.getGender());
        user.setAge(request.getAge());
        user.setWeightKg(request.getWeightKg());
        user.setTargetWeightKg(request.getTargetWeightKg());
        user.setHeightCm(request.getHeightCm());
        user.setActivityLevel(request.getActivityLevel());
        user.setHealthGoal(request.getHealthGoal());
        user.setWeightChangeSpeed(request.getWeightChangeSpeed());
        user.setExperienceLevel(request.getExperienceLevel());
        user.setDietaryPreference(request.getDietaryPreference());
        user.setWaterGoalGlasses(request.getWaterGoalGlasses() != null ? request.getWaterGoalGlasses() : 8);
        user.setProfileComplete(Boolean.TRUE);

        // Compute and persist macro targets
        computeAndStoreMacros(user);

        userRepository.save(user);
        return ResponseEntity.ok(buildProfile(user));
    }

    /** Recomputes macro targets and stores them on the user entity (call before save). */
    private void computeAndStoreMacros(User user) {
        Double w = user.getWeightKg();
        Double h = user.getHeightCm();
        Integer a = user.getAge();
        if (w == null || h == null || a == null) return;

        // Mifflin-St Jeor BMR
        double bmr = "female".equalsIgnoreCase(user.getGender())
                ? (10 * w) + (6.25 * h) - (5 * a) - 161
                : (10 * w) + (6.25 * h) - (5 * a) + 5;

        // Activity multiplier
        double actMult = switch (user.getActivityLevel() != null ? user.getActivityLevel() : "sedentary") {
            case "lightly_active"    -> 1.375;
            case "moderately_active" -> 1.55;
            case "very_active"       -> 1.725;
            case "athlete"           -> 1.9;
            default                  -> 1.2;
        };
        int tdee = (int) Math.round(bmr * actMult);

        // Calorie goal — bulk/cut speed overrides fixed delta
        String goal  = user.getHealthGoal() != null ? user.getHealthGoal() : "general_fitness";
        String speed = user.getWeightChangeSpeed();

        int calorieGoal = switch (goal) {
            case "lose_weight", "reduce_body_fat" -> switch (speed != null ? speed : "moderate_cut") {
                case "slow_cut"       -> tdee - 200;
                case "aggressive_cut" -> tdee - 600;
                default               -> tdee - 400;
            };
            case "gain_muscle", "gain_weight" -> switch (speed != null ? speed : "lean_bulk") {
                case "slow_bulk"       -> tdee + 150;
                case "aggressive_bulk" -> tdee + 400;
                default                -> tdee + 250;
            };
            case "increase_strength" -> tdee + 150;
            case "endurance"         -> tdee + 200;
            default                  -> tdee;
        };
        calorieGoal = Math.max(1200, calorieGoal);

        // Protein g/kg
        double proteinPerKg = switch (goal) {
            case "lose_weight", "reduce_body_fat"   -> 2.2;
            case "gain_muscle", "gain_weight"       -> 2.0;
            case "increase_strength"                -> 2.0;
            case "endurance"                        -> 1.8;
            default                                 -> 1.6;
        };
        int proteinGoal = (int) Math.round(w * proteinPerKg);

        // Fat ~0.9 g/kg
        int fatGoal = (int) Math.round(w * 0.9);

        // Carbs from remaining calories
        int carbCalories = calorieGoal - (proteinGoal * 4 + fatGoal * 9);
        int carbGoal = Math.max(50, (int) Math.round(carbCalories / 4.0));

        user.setDailyCalorieGoal(calorieGoal);
        user.setDailyProteinGoal(proteinGoal);
        user.setDailyCarbGoal(carbGoal);
        user.setDailyFatGoal(fatGoal);
    }

    private Map<String, Object> buildProfile(User user) {
        Map<String, Object> p = new HashMap<>();
        p.put("id",               user.getId());
        p.put("name",             user.getName());
        p.put("email",            user.getEmail());
        p.put("evolutionStage",   user.getEvolutionStage());
        p.put("evolutionPoints",  user.getEvolutionPoints());
        p.put("streak",           user.getStreak());
        p.put("profileComplete",  user.getProfileComplete());
        p.put("gender",           user.getGender());
        p.put("age",              user.getAge());
        p.put("weightKg",         user.getWeightKg());
        p.put("targetWeightKg",   user.getTargetWeightKg());
        p.put("heightCm",         user.getHeightCm());
        p.put("activityLevel",    user.getActivityLevel());
        p.put("healthGoal",       user.getHealthGoal());
        p.put("weightChangeSpeed",user.getWeightChangeSpeed());
        p.put("experienceLevel",  user.getExperienceLevel());
        p.put("dietaryPreference",user.getDietaryPreference());
        p.put("waterGoalGlasses", user.getWaterGoalGlasses() != null ? user.getWaterGoalGlasses() : 8);
        p.put("strengthAttr",     user.getStrengthAttr());
        p.put("disciplineAttr",   user.getDisciplineAttr());
        p.put("recoveryAttr",     user.getRecoveryAttr());
        p.put("nutritionAttr",    user.getNutritionAttr());

        // Stored macro targets (set during onboarding/profile update)
        p.put("dailyCalorieGoal", user.getDailyCalorieGoal());
        p.put("dailyProteinGoal", user.getDailyProteinGoal());
        p.put("dailyCarbGoal",    user.getDailyCarbGoal());
        p.put("dailyFatGoal",     user.getDailyFatGoal());

        Double w = user.getWeightKg();
        Double h = user.getHeightCm();

        if (w != null && h != null) {
            double heightM = h / 100.0;
            double bmi = Math.round((w / (heightM * heightM)) * 10.0) / 10.0;
            p.put("bmi", bmi);
            p.put("bmiCategory", bmiCategory(bmi));
        }

        // Re-expose TDEE for display (no re-persistence needed)
        if (user.getAge() != null && w != null && h != null) {
            double bmr = "female".equalsIgnoreCase(user.getGender())
                    ? (10 * w) + (6.25 * h) - (5 * user.getAge()) - 161
                    : (10 * w) + (6.25 * h) - (5 * user.getAge()) + 5;
            double actMult = switch (user.getActivityLevel() != null ? user.getActivityLevel() : "sedentary") {
                case "lightly_active"    -> 1.375;
                case "moderately_active" -> 1.55;
                case "very_active"       -> 1.725;
                case "athlete"           -> 1.9;
                default                  -> 1.2;
            };
            p.put("tdee", (int) Math.round(bmr * actMult));
        }

        return p;
    }

    private String bmiCategory(double bmi) {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25.0) return "Normal";
        if (bmi < 30.0) return "Overweight";
        return "Obese";
    }
}
