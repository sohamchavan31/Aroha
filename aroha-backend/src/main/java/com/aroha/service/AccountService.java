package com.aroha.service;

import com.aroha.model.User;
import com.aroha.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Store requirements: users must be able to delete their account and its data
 * from inside the app, and should be able to take a copy of their data.
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final DailyLogRepository dailyLogRepository;
    private final EvolutionLogRepository evolutionLogRepository;
    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;
    private final MealRepository mealRepository;
    private final MissionRepository missionRepository;
    private final SleepLogRepository sleepLogRepository;
    private final TaskRepository taskRepository;
    private final WaterLogRepository waterLogRepository;
    private final WeightLogRepository weightLogRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /** Permanently deletes the user and everything they logged. Needs their password. */
    @Transactional
    public void deleteAccount(User principal, String password) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            // 400, not 401/403: the app treats those as "session expired" and logs out.
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect password");
        }
        Long id = user.getId();
        dailyLogRepository.deleteByUserId(id);
        habitLogRepository.deleteByUserId(id);
        habitRepository.deleteByUserId(id);
        missionRepository.deleteByUserId(id);
        evolutionLogRepository.deleteByUserId(id);
        sleepLogRepository.deleteByUserId(id);
        waterLogRepository.deleteByUserId(id);
        weightLogRepository.deleteByUserId(id);
        workoutLogRepository.deleteByUserId(id);
        workoutSessionRepository.deleteByUserId(id);
        taskRepository.deleteByUserId(id);
        refreshTokenRepository.deleteByUserId(id);
        mealRepository.deleteByCreatedBy(id);
        userRepository.delete(user);
    }

    /** Everything stored about the user, as plain JSON. The password hash is never included. */
    @Transactional(readOnly = true)
    public Map<String, Object> exportData(User principal) {
        User u = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        Long id = u.getId();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", u.getName());
        profile.put("email", u.getEmail());
        profile.put("createdAt", u.getCreatedAt());
        profile.put("evolutionStage", u.getEvolutionStage());
        profile.put("evolutionPoints", u.getEvolutionPoints());
        profile.put("streak", u.getStreak());
        profile.put("gender", u.getGender());
        profile.put("age", u.getAge());
        profile.put("heightCm", u.getHeightCm());
        profile.put("weightKg", u.getWeightKg());
        profile.put("targetWeightKg", u.getTargetWeightKg());
        profile.put("activityLevel", u.getActivityLevel());
        profile.put("healthGoal", u.getHealthGoal());
        profile.put("weightChangeSpeed", u.getWeightChangeSpeed());
        profile.put("experienceLevel", u.getExperienceLevel());
        profile.put("dietaryPreference", u.getDietaryPreference());
        profile.put("waterGoalGlasses", u.getWaterGoalGlasses());
        profile.put("dailyCalorieGoal", u.getDailyCalorieGoal());
        profile.put("dailyProteinGoal", u.getDailyProteinGoal());
        profile.put("dailyCarbGoal", u.getDailyCarbGoal());
        profile.put("dailyFatGoal", u.getDailyFatGoal());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exportedAt", LocalDateTime.now());
        out.put("app", "Aroha");
        out.put("profile", profile);
        out.put("foodLog", dailyLogRepository.findByUserId(id));
        out.put("customFoods", mealRepository.findByCreatedBy(id));
        out.put("workoutLog", workoutLogRepository.findByUserId(id));
        out.put("workoutSessions", workoutSessionRepository.findByUserId(id));
        out.put("weightLog", weightLogRepository.findByUserId(id));
        out.put("waterLog", waterLogRepository.findByUserId(id));
        out.put("sleepLog", sleepLogRepository.findByUserId(id));
        out.put("habits", habitRepository.findByUserId(id));
        out.put("habitLog", habitLogRepository.findByUserId(id));
        out.put("tasks", taskRepository.findByUserId(id));
        out.put("missions", missionRepository.findByUserId(id));
        out.put("evolutionLog", evolutionLogRepository.findByUserId(id));
        return out;
    }
}
