package com.aroha.service;

import com.aroha.model.DailyLog;
import com.aroha.model.Mission;
import com.aroha.model.User;
import com.aroha.model.WorkoutSession;
import com.aroha.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Runs after anything the user logs (food, sets, sessions, water, sleep, habits,
 * tasks, weigh-ins, missions):
 *  1. keeps the day streak — +1 on the first activity of a day that follows an
 *     active yesterday, back to 1 after a gap; a frozen streak (one missed day,
 *     see StreakRules) is left alone so it can still be thawed today;
 *  2. completes today's auto-verifiable missions whose condition is now met.
 * It never throws: a failure here must not undo the action that triggered it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final UserRepository userRepository;
    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final DailyLogRepository dailyLogRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final SleepLogRepository sleepLogRepository;
    private final WaterLogRepository waterLogRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final WeightLogRepository weightLogRepository;
    private final MealRepository mealRepository;
    private final TaskRepository taskRepository;

    // Deliberately not @Transactional: each save commits on its own, so a failure
    // in mission checks can't roll back (or poison) the streak update.
    public void recordActivity(User principal) {
        try {
            User user = userRepository.findById(principal.getId()).orElse(null);
            if (user == null) return;
            LocalDate today = LocalDate.now();

            updateStreak(user, today);
            userRepository.save(user);
            completeMetMissions(user, LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Activity bookkeeping failed for user {}", principal.getId(), e);
        }
    }

    /**
     * Completes today's automatic missions whose condition now holds. Also run
     * when missions are fetched, for the time-based ones (before 8 AM, after 8 PM)
     * that no log triggers. Doesn't touch the streak.
     */
    public void checkMissions(User principal) {
        try {
            userRepository.findById(principal.getId()).ifPresent(u -> completeMetMissions(u, LocalDateTime.now()));
        } catch (Exception e) {
            log.warn("Mission check failed for user {}", principal.getId(), e);
        }
    }

    void completeMetMissions(User user, LocalDateTime now) {
        for (Mission m : missionRepository.findByUserIdAndMissionDate(user.getId(), now.toLocalDate())) {
            if (!m.isCompleted() && AutoMission.kind(m.getAutoKey()) == AutoMission.Kind.AUTO
                    && isMet(m.getAutoKey(), user, now)) {
                missionService.complete(user, m);
            }
        }
    }

    static void updateStreak(User user, LocalDate today) {
        LocalDate last = user.getLastActiveDate();
        if (today.equals(last)) return;
        if (StreakRules.isFrozen(user, today)) return; // waiting for the thaw
        boolean continues = last != null && last.equals(today.minusDays(1));
        user.setStreak(continues ? user.getStreak() + 1 : 1);
        user.setLastActiveDate(today);
    }

    private boolean isMet(String key, User user, LocalDateTime now) {
        Long id = user.getId();
        LocalDate today = now.toLocalDate();
        return switch (key) {
            // Sets logged by hand in Train count too (about 2.5 min each with rest).
            case AutoMission.WORKOUT_20 -> Math.max(
                    sessionsToday(id, today).stream().mapToInt(WorkoutSession::getActualSeconds).sum() / 60,
                    Training.minutes(setsToday(id, today))) >= 20;
            case AutoMission.SESSION_DONE -> !sessionsToday(id, today).isEmpty() || setsToday(id, today) >= 6;
            case AutoMission.PUSHUPS_3 -> workoutLogRepository.findByUserIdAndLogDateOrderByLoggedAtAsc(id, today).stream()
                    .filter(w -> isPushUp(w.getExerciseName()))
                    .mapToInt(w -> Math.max(1, w.getSets())).sum() >= 3;
            case AutoMission.CHECKIN_EARLY -> now.getHour() < AutoMission.EARLY_HOUR;
            case AutoMission.PLAN_TOMORROW -> taskRepository
                    .findByUserIdAndTaskDateOrderByScheduledTimeAscCreatedAtAsc(id, today.plusDays(1)).size() >= 3;
            case AutoMission.WEIGHED_IN -> weightLogRepository.findByUserIdAndLoggedDate(id, today).isPresent();
            case AutoMission.FRUIT_VEG -> {
                List<Long> mealIds = foodToday(id, today).stream().map(DailyLog::getMealId).distinct().toList();
                yield !mealIds.isEmpty() && mealRepository.findAllById(mealIds).stream()
                        .map(m -> m.getCategory() == null ? "" : m.getCategory().toLowerCase())
                        .anyMatch(c -> c.equals("fruit") || c.equals("sabzi"));
            }
            case AutoMission.CALORIES_ON_TARGET -> {
                Integer goal = user.getDailyCalorieGoal();
                if (goal == null || goal <= 0 || now.getHour() < AutoMission.EVENING_HOUR) yield false;
                double eaten = foodToday(id, today).stream().mapToDouble(DailyLog::getCalories).sum();
                yield eaten >= goal * 0.8 && eaten <= goal * 1.05;
            }
            case AutoMission.ALL_HABITS -> {
                long habits = habitRepository.countByUserId(id);
                long done = habitLogRepository.findByUserIdAndLogDateBetween(id, today, today).stream()
                        .filter(h -> h.isCompleted()).map(h -> h.getHabitId()).distinct().count();
                yield habits > 0 && done >= habits;
            }
            case AutoMission.SLEEP_LOGGED -> sleepLogRepository.findByUserIdAndLogDate(id, today).isPresent();
            case AutoMission.SLEEP_7H -> sleepLogRepository.findByUserIdAndLogDate(id, today)
                    .map(s -> s.getDurationHours() >= 7).orElse(false);
            case AutoMission.WATER_GOAL -> {
                int goal = user.getWaterGoalGlasses() != null ? user.getWaterGoalGlasses() : 8;
                yield waterLogRepository.findByUserIdAndLogDate(id, today)
                        .map(w -> w.getGlasses() >= goal).orElse(false);
            }
            case AutoMission.MEALS_LOGGED -> {
                Set<String> slots = foodToday(id, today).stream()
                        .map(DailyLog::getMealSlot).filter(s -> s != null)
                        .map(String::toUpperCase).collect(Collectors.toSet());
                yield slots.containsAll(Set.of("BREAKFAST", "LUNCH", "DINNER"));
            }
            case AutoMission.BREAKFAST_PROTEIN -> foodToday(id, today).stream()
                    .filter(d -> "BREAKFAST".equalsIgnoreCase(d.getMealSlot()))
                    .mapToDouble(DailyLog::getProtein).sum() >= 20;
            default -> false;
        };
    }

    // "Push-ups", "Push Up", "Diamond pushups", "Incline Push-Up"…
    static boolean isPushUp(String exerciseName) {
        return exerciseName != null && exerciseName.toLowerCase().replaceAll("[\\s-]", "").contains("pushup");
    }

    private List<WorkoutSession> sessionsToday(Long userId, LocalDate today) {
        return workoutSessionRepository.findByUserIdAndCompletedAtBetween(
                userId, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
    }

    private int setsToday(Long userId, LocalDate today) {
        return Training.sets(workoutLogRepository.findByUserIdAndLogDateOrderByLoggedAtAsc(userId, today));
    }

    private List<DailyLog> foodToday(Long userId, LocalDate today) {
        return dailyLogRepository.findByUserIdAndLogDateOrderByLoggedAtAsc(userId, today);
    }
}
