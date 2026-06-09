package com.aroha.controller;

import com.aroha.model.DailyLog;
import com.aroha.model.HabitLog;
import com.aroha.model.User;
import com.aroha.repository.DailyLogRepository;
import com.aroha.repository.HabitLogRepository;
import com.aroha.repository.HabitRepository;
import com.aroha.repository.WeightLogRepository;
import com.aroha.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DailyLogRepository dailyLogRepository;
    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;
    private final WeightLogRepository weightLogRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(7);
        LocalDate thirtyDaysAgo = today.minusDays(30);
        LocalDateTime weekStart = today.with(DayOfWeek.MONDAY).atStartOfDay();

        // Avg nutrition over last 7 days — group entries by date, then average the daily totals
        List<DailyLog> logs7d = dailyLogRepository.findByUserIdAndLogDateBetween(
                user.getId(), sevenDaysAgo, today);

        Map<LocalDate, double[]> dailyTotals = new HashMap<>();
        for (DailyLog log : logs7d) {
            dailyTotals.merge(log.getLogDate(),
                    new double[]{log.getCalories(), log.getProtein(), log.getCarbs(), log.getFat()},
                    (a, b) -> new double[]{a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]});
        }
        double avgCal   = dailyTotals.values().stream().mapToDouble(v -> v[0]).average().orElse(0);
        double avgProt  = dailyTotals.values().stream().mapToDouble(v -> v[1]).average().orElse(0);
        double avgCarbs = dailyTotals.values().stream().mapToDouble(v -> v[2]).average().orElse(0);
        double avgFat   = dailyTotals.values().stream().mapToDouble(v -> v[3]).average().orElse(0);

        // Workouts this week (Monday → now)
        long workoutsThisWeek = workoutSessionRepository
                .countByUserIdAndCompletedAtAfter(user.getId(), weekStart);

        // Habit completion rate — last 7 days
        long totalHabits = habitRepository.countByUserId(user.getId());
        List<HabitLog> habitLogs7d = habitLogRepository
                .findByUserIdAndLogDateBetween(user.getId(), sevenDaysAgo, today);
        double habitRate = totalHabits > 0
                ? Math.min(1.0, (double) habitLogs7d.size() / (totalHabits * 7))
                : 0.0;

        // Weight: latest entry and 30-day change
        double currentWeight = weightLogRepository
                .findFirstByUserIdOrderByLoggedDateDesc(user.getId())
                .map(w -> w.getWeightKg()).orElse(0.0);
        double oldWeight = weightLogRepository
                .findFirstByUserIdAndLoggedDateBeforeOrderByLoggedDateDesc(user.getId(), thirtyDaysAgo)
                .map(w -> w.getWeightKg()).orElse(0.0);
        double weightChange30d = (currentWeight > 0 && oldWeight > 0)
                ? Math.round((currentWeight - oldWeight) * 10.0) / 10.0
                : 0.0;

        // Goal progress towards target weight
        Double startWeight  = user.getWeightKg();
        Double targetWeight = user.getTargetWeightKg();
        Integer goalProgressPct = null;
        if (startWeight != null && targetWeight != null && currentWeight > 0) {
            double range = targetWeight - startWeight;
            if (Math.abs(range) > 0.01) {
                double progress = (currentWeight - startWeight) / range;
                goalProgressPct = (int) Math.round(Math.min(100, Math.max(0, progress * 100)));
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("avgCalories7d",          Math.round(avgCal));
        result.put("avgProteinG7d",           Math.round(avgProt  * 10.0) / 10.0);
        result.put("avgCarbsG7d",             Math.round(avgCarbs * 10.0) / 10.0);
        result.put("avgFatG7d",               Math.round(avgFat   * 10.0) / 10.0);
        result.put("workoutsThisWeek",        workoutsThisWeek);
        result.put("habitCompletionRate7d",   Math.round(habitRate * 100.0) / 100.0);
        result.put("currentWeightKg",         currentWeight);
        result.put("weightChange30d",         weightChange30d);
        result.put("loggedDays7d",            dailyTotals.size());
        result.put("targetWeightKg",          targetWeight);
        result.put("startWeightKg",           startWeight);
        result.put("goalProgressPct",         goalProgressPct);
        return ResponseEntity.ok(result);
    }
}
