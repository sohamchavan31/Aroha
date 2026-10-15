package com.aroha.controller;

import com.aroha.service.BodyMetrics;
import com.aroha.service.StreakRules;
import com.aroha.dto.AvatarRequest;
import com.aroha.dto.ProfileRequest;
import com.aroha.model.User;
import com.aroha.repository.UserRepository;
import com.aroha.service.MacroCalculator;
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
        MacroCalculator.apply(user);

        userRepository.save(user);
        return ResponseEntity.ok(buildProfile(user));
    }

    @PatchMapping("/avatar")
    public ResponseEntity<Map<String, Object>> updateAvatar(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AvatarRequest request) {

        user.setAvatarKey(request.getAvatarKey());
        userRepository.save(user);
        return ResponseEntity.ok(buildProfile(user));
    }

    private Map<String, Object> buildProfile(User user) {
        Map<String, Object> p = new HashMap<>();
        p.put("id",               user.getId());
        p.put("name",             user.getName());
        p.put("email",            user.getEmail());
        p.put("evolutionStage",   user.getEvolutionStage());
        p.put("evolutionPoints",  user.getEvolutionPoints());
        StreakRules.Status streak = StreakRules.status(user, java.time.LocalDate.now());
        p.put("streak",           streak.streak());
        p.put("streakState",      streak.state());
        p.put("streakThawReps",   streak.thawReps());
        p.put("profileComplete",  user.getProfileComplete());
        p.put("emailVerified",    user.isEmailVerified());
        p.put("passwordSet",      user.isPasswordSet());
        p.put("googleLinked",     user.getGoogleSub() != null);
        p.put("avatarKey",        user.getAvatarKey());
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

        Double bmi = BodyMetrics.bmi(w, h);
        if (bmi != null) {
            p.put("bmi", bmi);
            p.put("bmiCategory", BodyMetrics.bmiCategory(bmi));
        }
        Integer tdee = BodyMetrics.tdee(BodyMetrics.bmr(user.getGender(), w, h, user.getAge()), user.getActivityLevel());
        if (tdee != null) p.put("tdee", tdee);

        return p;
    }
}
