package com.aroha.service;

import com.aroha.dto.WorkoutExerciseDto;
import com.aroha.dto.WorkoutPlanRequest;
import com.aroha.dto.WorkoutPlanResponse;
import com.aroha.model.Exercise;
import com.aroha.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkoutGeneratorService {

    private final ExerciseRepository exerciseRepository;

    // ── Timing config per workout type ───────────────────────────────────────
    record Config(int sets, int reps, int restSeconds, int repTimeSeconds,
                  List<String> categories, Set<String> muscleGroups) {}

    private static final Map<String, Config> CONFIGS = Map.of(
        "PUSH",      new Config(4, 10, 90, 3, List.of("strength"),         Set.of("chest","shoulders","arms")),
        "PULL",      new Config(4, 10, 90, 3, List.of("strength"),         Set.of("back","arms")),
        "LEGS",      new Config(4, 12, 90, 3, List.of("strength"),         Set.of("legs")),
        "CARDIO",    new Config(3, 30, 30, 1, List.of("cardio"),           Set.of()),
        "FULL_BODY", new Config(3, 12, 60, 2, List.of("strength","cardio"),Set.of()),
        "CROSSFIT",  new Config(4, 12, 60, 2, List.of("strength","cardio"),Set.of()),
        "YOGA",      new Config(1, 30, 10, 1, List.of("yoga","flexibility"),Set.of()),
        "CORE",      new Config(3, 15, 45, 2, List.of("strength"),         Set.of("core"))
    );

    private static final int WARMUP_BUFFER_SECONDS = 300; // 5-min warmup reserve
    private static final int TRANSITION_SECONDS     = 30;  // between exercises

    public WorkoutPlanResponse generate(WorkoutPlanRequest request) {
        String type = request.getWorkoutType().toUpperCase();
        Config cfg  = CONFIGS.getOrDefault(type, CONFIGS.get("FULL_BODY"));

        int budget = request.getDurationMinutes() * 60 - WARMUP_BUFFER_SECONDS;

        List<Exercise> pool = exerciseRepository.findByCategoryIn(cfg.categories());

        // Filter by muscle group when specified
        if (!cfg.muscleGroups().isEmpty()) {
            pool = pool.stream()
                    .filter(e -> cfg.muscleGroups().contains(e.getMuscleGroup()))
                    .toList();
        }

        // Shuffle for variety
        List<Exercise> shuffled = new ArrayList<>(pool);
        Collections.shuffle(shuffled);

        List<WorkoutExerciseDto> selected = new ArrayList<>();
        int usedSeconds = 0;

        for (Exercise ex : shuffled) {
            if (usedSeconds >= budget) break;
            int est = estimateSeconds(cfg.sets(), cfg.reps(), cfg.restSeconds(), cfg.repTimeSeconds());
            selected.add(WorkoutExerciseDto.builder()
                    .id(ex.getId())
                    .name(ex.getName())
                    .category(ex.getCategory())
                    .muscleGroup(ex.getMuscleGroup())
                    .sets(cfg.sets())
                    .reps(cfg.reps())
                    .restSeconds(cfg.restSeconds())
                    .estimatedSeconds(est)
                    .build());
            usedSeconds += est + TRANSITION_SECONDS;
        }

        int estimatedMinutes = (usedSeconds + WARMUP_BUFFER_SECONDS) / 60;

        return WorkoutPlanResponse.builder()
                .workoutType(type)
                .requestedMinutes(request.getDurationMinutes())
                .estimatedMinutes(estimatedMinutes)
                .exercises(selected)
                .build();
    }

    private int estimateSeconds(int sets, int reps, int restSeconds, int repTimeSeconds) {
        int workTime = sets * reps * repTimeSeconds;
        int restTime = (sets - 1) * restSeconds;
        return workTime + restTime;
    }
}
