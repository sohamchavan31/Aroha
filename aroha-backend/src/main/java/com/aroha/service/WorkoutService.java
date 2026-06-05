package com.aroha.service;

import com.aroha.dto.WorkoutLogRequest;
import com.aroha.model.Exercise;
import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import com.aroha.repository.ExerciseRepository;
import com.aroha.repository.WorkoutLogRepository;
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
public class WorkoutService {

    private final WorkoutLogRepository workoutLogRepository;
    private final ExerciseRepository exerciseRepository;

    public WorkoutLog logExercise(User user, WorkoutLogRequest request) {
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        WorkoutLog log = WorkoutLog.builder()
                .userId(user.getId())
                .exerciseId(exercise.getId())
                .exerciseName(exercise.getName())
                .category(exercise.getCategory())
                .sets(request.getSets())
                .reps(request.getReps())
                .weightKg(request.getWeightKg())
                .logDate(LocalDate.now())
                .build();

        return workoutLogRepository.save(log);
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
        response.put("exerciseCount", entries.size());
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
}
