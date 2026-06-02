package com.nira.controller;

import com.nira.dto.ProfileRequest;
import com.nira.model.User;
import com.nira.repository.UserRepository;
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
        Map<String, Object> profile = buildProfile(user);
        return ResponseEntity.ok(profile);
    }

    @PatchMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProfileRequest request) {

        user.setAge(request.getAge());
        user.setWeightKg(request.getWeightKg());
        user.setHeightCm(request.getHeightCm());
        user.setHealthGoal(request.getHealthGoal());
        user.setWaterGoalGlasses(request.getWaterGoalGlasses() != null ? request.getWaterGoalGlasses() : 8);
        user.setProfileComplete(true);

        userRepository.save(user);
        return ResponseEntity.ok(buildProfile(user));
    }

    private Map<String, Object> buildProfile(User user) {
        Map<String, Object> p = new HashMap<>();
        p.put("id",               user.getId());
        p.put("name",             user.getName());
        p.put("email",            user.getEmail());
        p.put("rank",             user.getRank());
        p.put("totalXp",          user.getTotalXp());
        p.put("streak",           user.getStreak());
        p.put("profileComplete",  user.isProfileComplete());
        p.put("age",              user.getAge());
        p.put("weightKg",         user.getWeightKg());
        p.put("heightCm",         user.getHeightCm());
        p.put("healthGoal",       user.getHealthGoal());
        p.put("waterGoalGlasses", user.getWaterGoalGlasses() != null ? user.getWaterGoalGlasses() : 8);

        // BMI
        if (user.getWeightKg() != null && user.getHeightCm() != null) {
            double heightM = user.getHeightCm() / 100.0;
            double bmi = Math.round((user.getWeightKg() / (heightM * heightM)) * 10.0) / 10.0;
            p.put("bmi", bmi);
            p.put("bmiCategory", bmiCategory(bmi));
        }

        // TDEE (Harris-Benedict, sedentary — will personalise in Phase 12 expansion)
        if (user.getAge() != null && user.getWeightKg() != null && user.getHeightCm() != null) {
            // Using male formula as default; gender field added in future
            double bmr = 88.362 + (13.397 * user.getWeightKg())
                       + (4.799 * user.getHeightCm())
                       - (5.677 * user.getAge());
            int tdee = (int) Math.round(bmr * 1.375); // lightly active
            p.put("tdee", tdee);
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
