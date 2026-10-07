package com.aroha.service;

import com.aroha.dto.WorkoutExerciseDto;
import com.aroha.dto.WorkoutPlanRequest;
import com.aroha.model.Exercise;
import com.aroha.repository.ExerciseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

// Loads the real seed file, which also proves data.sql runs (and re-runs) cleanly.
@SpringBootTest
@Sql(scripts = "classpath:data.sql")
class WorkoutGeneratorServiceTest {

    private static final Set<String> HOME_KIT = Set.of("none", "mat", "pullup_bar", "rope");

    @Autowired WorkoutGeneratorService generator;
    @Autowired ExerciseRepository exerciseRepository;

    private Map<Long, Exercise> byId() {
        return exerciseRepository.findAll().stream().collect(Collectors.toMap(Exercise::getId, e -> e));
    }

    private static WorkoutPlanRequest req(String type, String location) {
        WorkoutPlanRequest r = new WorkoutPlanRequest();
        r.setDurationMinutes(60);
        r.setWorkoutType(type);
        r.setLocation(location);
        return r;
    }

    @Test
    void gymLibraryIsSeeded() {
        long gym = exerciseRepository.findAll().stream().filter(e -> !HOME_KIT.contains(e.getEquipment())).count();
        assertTrue(gym >= 60, "expected the gym library, found " + gym);
    }

    @Test
    void homeWorkoutsUseNoGymKit() {
        Map<Long, Exercise> all = byId();
        for (int i = 0; i < 5; i++) {
            for (WorkoutExerciseDto ex : generator.generate(req("PUSH", "HOME")).getExercises()) {
                assertTrue(HOME_KIT.contains(all.get(ex.getId()).getEquipment()), ex.getName() + " needs gym kit");
            }
        }
    }

    @Test
    void gymWorkoutsLeadWithWeightsAndMachines() {
        Map<Long, Exercise> all = byId();
        var exercises = generator.generate(req("LEGS", "GYM")).getExercises();
        assertFalse(exercises.isEmpty());
        assertFalse(HOME_KIT.contains(all.get(exercises.get(0).getId()).getEquipment()));
    }
}
