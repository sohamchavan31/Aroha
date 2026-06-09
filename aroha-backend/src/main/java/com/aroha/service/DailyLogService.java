package com.aroha.service;

import com.aroha.dto.DailyLogRequest;
import com.aroha.model.DailyLog;
import com.aroha.model.Meal;
import com.aroha.model.User;
import com.aroha.repository.DailyLogRepository;
import com.aroha.repository.MealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DailyLogService {

    private final DailyLogRepository dailyLogRepository;
    private final MealRepository mealRepository;

    public DailyLog addEntry(User user, DailyLogRequest request) {
        Meal meal = mealRepository.findById(request.getMealId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meal not found"));

        double ratio = request.getServingGrams() / 100.0;

        DailyLog log = DailyLog.builder()
                .userId(user.getId())
                .mealId(meal.getId())
                .mealName(meal.getName())
                .mealSlot(request.getMealSlot())
                .servingGrams(request.getServingGrams())
                .calories(Math.round(meal.getCaloriesPer100g() * ratio * 10.0) / 10.0)
                .protein(Math.round(meal.getProteinPer100g() * ratio * 10.0) / 10.0)
                .carbs(Math.round(meal.getCarbsPer100g() * ratio * 10.0) / 10.0)
                .fat(Math.round(meal.getFatPer100g() * ratio * 10.0) / 10.0)
                .logDate(LocalDate.now())
                .build();

        return dailyLogRepository.save(log);
    }

    public Map<String, Object> getTodayLog(User user) {
        LocalDate today = LocalDate.now();
        List<DailyLog> entries = dailyLogRepository
                .findByUserIdAndLogDateOrderByLoggedAtAsc(user.getId(), today);

        double totalCalories = entries.stream().mapToDouble(DailyLog::getCalories).sum();
        double totalProtein  = entries.stream().mapToDouble(DailyLog::getProtein).sum();
        double totalCarbs    = entries.stream().mapToDouble(DailyLog::getCarbs).sum();
        double totalFat      = entries.stream().mapToDouble(DailyLog::getFat).sum();

        Map<String, Object> response = new HashMap<>();
        response.put("entries", entries);
        response.put("totalCalories", Math.round(totalCalories * 10.0) / 10.0);
        response.put("totalProtein",  Math.round(totalProtein  * 10.0) / 10.0);
        response.put("totalCarbs",    Math.round(totalCarbs    * 10.0) / 10.0);
        response.put("totalFat",      Math.round(totalFat      * 10.0) / 10.0);
        return response;
    }

    public void deleteEntry(User user, Long logId) {
        DailyLog log = dailyLogRepository.findById(logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Log entry not found"));

        if (!log.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your log entry");
        }

        dailyLogRepository.delete(log);
    }
}
