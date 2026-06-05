package com.aroha.service;

import com.aroha.dto.HabitRequest;
import com.aroha.model.Habit;
import com.aroha.model.HabitLog;
import com.aroha.model.User;
import com.aroha.repository.HabitLogRepository;
import com.aroha.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    public Habit createHabit(User user, HabitRequest request) {
        Habit habit = Habit.builder()
                .userId(user.getId())
                .name(request.getName())
                .color(request.getColor())
                .icon(request.getIcon())
                .build();
        return habitRepository.save(habit);
    }

    public List<Habit> getUserHabits(User user) {
        return habitRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
    }

    public void deleteHabit(User user, Long habitId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habit not found"));
        if (!habit.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your habit");
        }
        habitRepository.delete(habit);
    }

    // Toggle completion for a habit on a given date
    public boolean toggle(User user, Long habitId, LocalDate date) {
        habitRepository.findById(habitId)
                .filter(h -> h.getUserId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Habit not found"));

        Optional<HabitLog> existing = habitLogRepository.findByHabitIdAndLogDate(habitId, date);

        if (existing.isPresent()) {
            HabitLog log = existing.get();
            log.setCompleted(!log.isCompleted());
            habitLogRepository.save(log);
            return log.isCompleted();
        } else {
            HabitLog log = HabitLog.builder()
                    .habitId(habitId)
                    .userId(user.getId())
                    .logDate(date)
                    .completed(true)
                    .build();
            habitLogRepository.save(log);
            return true;
        }
    }

    // Returns monthly data: list of habits, each with a completedDays set
    public Map<String, Object> getMonthlyView(User user, int year, int month) {
        YearMonth ym    = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end   = ym.atEndOfMonth();
        int daysInMonth = ym.lengthOfMonth();

        List<Habit> habits = habitRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        List<HabitLog> logs = habitLogRepository.findByUserIdAndLogDateBetween(user.getId(), start, end);

        // Map: habitId → set of completed day numbers
        Map<Long, Set<Integer>> completionMap = new HashMap<>();
        for (HabitLog log : logs) {
            if (log.isCompleted()) {
                completionMap
                        .computeIfAbsent(log.getHabitId(), k -> new HashSet<>())
                        .add(log.getLogDate().getDayOfMonth());
            }
        }

        List<Map<String, Object>> habitData = new ArrayList<>();
        for (Habit habit : habits) {
            Set<Integer> completed = completionMap.getOrDefault(habit.getId(), new HashSet<>());
            int completedCount = completed.size();
            double pct = daysInMonth > 0 ? Math.round((completedCount * 100.0 / daysInMonth) * 10) / 10.0 : 0;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id",            habit.getId());
            entry.put("name",          habit.getName());
            entry.put("color",         habit.getColor());
            entry.put("icon",          habit.getIcon());
            entry.put("completedDays", completed);
            entry.put("completedCount",completedCount);
            entry.put("percentage",    pct);
            habitData.add(entry);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("year",        year);
        response.put("month",       month);
        response.put("daysInMonth", daysInMonth);
        response.put("habits",      habitData);
        return response;
    }
}
