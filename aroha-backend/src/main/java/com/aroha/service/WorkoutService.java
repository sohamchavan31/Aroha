package com.aroha.service;

import com.aroha.dto.WorkoutSetsRequest;
import com.aroha.dto.WorkoutLogRequest;
import com.aroha.model.Exercise;
import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import com.aroha.repository.ExerciseRepository;
import com.aroha.repository.WorkoutLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutLogRepository workoutLogRepository;
    private final ExerciseRepository exerciseRepository;

    public WorkoutLog logExercise(User user, WorkoutLogRequest request) {
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        List<WorkoutLog> history = workoutLogRepository
                .findByUserIdAndExerciseIdOrderByLogDateAscLoggedAtAsc(user.getId(), exercise.getId());

        boolean newPR = false;
        if (!history.isEmpty()) {
            if (request.getWeightKg() > 0) {
                double prevBestWeight = history.stream().mapToDouble(WorkoutLog::getWeightKg).max().orElse(0);
                newPR = request.getWeightKg() > prevBestWeight;
            } else {
                int prevBestReps = history.stream()
                        .filter(h -> h.getWeightKg() == 0)
                        .mapToInt(WorkoutLog::getReps).max().orElse(0);
                newPR = request.getReps() > prevBestReps;
            }
        }

        WorkoutLog log = WorkoutLog.builder()
                .userId(user.getId())
                .exerciseId(exercise.getId())
                .exerciseName(exercise.getName())
                .category(exercise.getCategory())
                .sets(request.getSets())
                .reps(request.getReps())
                .weightKg(request.getWeightKg())
                .logDate(LocalDate.now())
                .newPR(newPR)
                .build();

        return workoutLogRepository.save(log);
    }

    /**
     * Logs one exercise as separate sets (each row = one set with its own
     * weight and reps). Flags a PR when the batch's best set beats every
     * earlier log of this exercise: heaviest weight, or most reps if bodyweight.
     */
    @Transactional
    public Map<String, Object> logSets(User user, WorkoutSetsRequest request) {
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        List<WorkoutLog> history = workoutLogRepository
                .findByUserIdAndExerciseIdOrderByLogDateAscLoggedAtAsc(user.getId(), exercise.getId());

        List<WorkoutSetsRequest.SetEntry> sets = request.getSets();
        boolean weighted = sets.stream().anyMatch(s -> s.getWeightKg() > 0);

        // The batch's best set: heaviest (most reps on ties), or most reps when bodyweight.
        WorkoutSetsRequest.SetEntry best = sets.stream()
                .filter(s -> !weighted || s.getWeightKg() > 0)
                .max(Comparator.comparingDouble((WorkoutSetsRequest.SetEntry s) -> weighted ? s.getWeightKg() : s.getReps())
                        .thenComparingInt(WorkoutSetsRequest.SetEntry::getReps))
                .orElseThrow();

        boolean newPR = false;
        if (!history.isEmpty()) {
            if (weighted) {
                double prevBest = history.stream().mapToDouble(WorkoutLog::getWeightKg).max().orElse(0);
                newPR = best.getWeightKg() > prevBest;
            } else {
                int prevBest = history.stream().filter(h -> h.getWeightKg() == 0)
                        .mapToInt(WorkoutLog::getReps).max().orElse(0);
                newPR = best.getReps() > prevBest;
            }
        }

        List<WorkoutLog> saved = new ArrayList<>();
        for (WorkoutSetsRequest.SetEntry s : sets) {
            saved.add(workoutLogRepository.save(WorkoutLog.builder()
                    .userId(user.getId())
                    .exerciseId(exercise.getId())
                    .exerciseName(exercise.getName())
                    .category(exercise.getCategory())
                    .sets(1)
                    .reps(s.getReps())
                    .weightKg(s.getWeightKg())
                    .logDate(LocalDate.now())
                    .newPR(newPR && s == best)
                    .build()));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("entries", saved);
        response.put("newPR", newPR);
        response.put("bestWeightKg", best.getWeightKg());
        response.put("bestReps", best.getReps());
        return response;
    }

    public Map<String, Object> getExerciseHistory(User user, Long exerciseId) {
        List<WorkoutLog> entries = workoutLogRepository
                .findByUserIdAndExerciseIdOrderByLogDateAscLoggedAtAsc(user.getId(), exerciseId);

        double bestWeightKg = entries.stream().mapToDouble(WorkoutLog::getWeightKg).max().orElse(0);
        int bestReps = entries.stream()
                .filter(e -> e.getWeightKg() == 0)
                .mapToInt(WorkoutLog::getReps).max().orElse(0);

        Map<String, Object> response = new HashMap<>();
        response.put("entries", entries);
        response.put("sessions", sessionsByDay(entries));
        response.put("bestWeightKg", bestWeightKg);
        response.put("bestReps", bestReps);
        return response;
    }

    public Map<String, Object> getTodayWorkout(User user) {
        List<WorkoutLog> entries = workoutLogRepository
                .findByUserIdAndLogDateOrderByLoggedAtAsc(user.getId(), LocalDate.now());

        int totalSets  = entries.stream().mapToInt(WorkoutLog::getSets).sum();
        int totalReps  = entries.stream().mapToInt(e -> e.getSets() * e.getReps()).sum();

        Map<String, Object> response = new HashMap<>();
        response.put("entries", entries);
        response.put("totalSets", totalSets);
        response.put("totalReps", totalReps);
        response.put("exerciseCount", entries.stream().map(WorkoutLog::getExerciseId).distinct().count());
        return response;
    }

    public void deleteEntry(User user, Long logId) {
        WorkoutLog log = workoutLogRepository.findById(logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Log entry not found"));

        if (!log.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your log entry");
        }

        workoutLogRepository.delete(log);
    }

    // One entry per day: every set that day plus the top weight / reps and total volume.
    // Older logs stored "3 × 10 @ 60 kg" in one row; those expand to 3 equal sets.
    static List<Map<String, Object>> sessionsByDay(List<WorkoutLog> entries) {
        Map<LocalDate, List<WorkoutLog>> byDay = new TreeMap<>();
        for (WorkoutLog e : entries) byDay.computeIfAbsent(e.getLogDate(), d -> new ArrayList<>()).add(e);

        List<Map<String, Object>> out = new ArrayList<>();
        for (var day : byDay.entrySet()) {
            List<Map<String, Object>> sets = new ArrayList<>();
            double top = 0, volume = 0;
            int topReps = 0, totalReps = 0;
            for (WorkoutLog e : day.getValue()) {
                for (int i = 0; i < Math.max(1, e.getSets()); i++) {
                    Map<String, Object> set = new HashMap<>();
                    set.put("reps", e.getReps());
                    set.put("weightKg", e.getWeightKg());
                    sets.add(set);
                    top = Math.max(top, e.getWeightKg());
                    topReps = Math.max(topReps, e.getReps());
                    totalReps += e.getReps();
                    volume += e.getWeightKg() * e.getReps();
                }
            }
            Map<String, Object> session = new HashMap<>();
            session.put("date", day.getKey());
            session.put("sets", sets);
            session.put("topWeightKg", top);
            session.put("topReps", topReps);
            session.put("totalReps", totalReps);
            session.put("volumeKg", Math.round(volume * 10) / 10.0);
            out.add(session);
        }
        return out;
    }
}
