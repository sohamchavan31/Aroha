package com.aroha.service;

import com.aroha.dto.WorkoutSetsRequest;
import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import com.aroha.repository.ExerciseRepository;
import com.aroha.repository.UserRepository;
import com.aroha.repository.WorkoutLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Sql(scripts = "classpath:data.sql")
class WorkoutSetsTest {

    @Autowired WorkoutService workoutService;
    @Autowired UserRepository userRepository;
    @Autowired ExerciseRepository exerciseRepository;
    @Autowired WorkoutLogRepository workoutLogRepository;

    private User user(String email) {
        return userRepository.save(User.builder().email(email).name("T").password("x")
                .evolutionStage("Spark").evolutionPoints(0).streak(0).profileComplete(true).build());
    }

    private Long benchId() {
        return exerciseRepository.findAll().stream()
                .filter(e -> e.getName().equals("Barbell Bench Press")).findFirst().orElseThrow().getId();
    }

    private static WorkoutSetsRequest req(Long exerciseId, double[][] sets) {
        WorkoutSetsRequest r = new WorkoutSetsRequest();
        r.setExerciseId(exerciseId);
        r.setSets(java.util.Arrays.stream(sets).map(s -> {
            WorkoutSetsRequest.SetEntry e = new WorkoutSetsRequest.SetEntry();
            e.setWeightKg(s[0]);
            e.setReps((int) s[1]);
            return e;
        }).toList());
        return r;
    }

    @Test
    void eachSetIsStoredWithItsOwnWeight() {
        User u = user("sets@test.dev");
        workoutService.logSets(u, req(benchId(), new double[][]{{60, 10}, {62.5, 8}, {65, 6}}));
        List<WorkoutLog> rows = workoutLogRepository.findByUserId(u.getId());
        assertEquals(3, rows.size());
        assertTrue(rows.stream().allMatch(r -> r.getSets() == 1));
        assertEquals(List.of(60.0, 62.5, 65.0), rows.stream().map(WorkoutLog::getWeightKg).sorted().toList());
    }

    @Test
    void prOnlyWhenTheBestSetBeatsHistory() {
        User u = user("pr@test.dev");
        Long id = benchId();
        Map<String, Object> first = workoutService.logSets(u, req(id, new double[][]{{60, 10}, {62.5, 8}}));
        assertEquals(false, first.get("newPR"));                       // first ever log is not a PR
        Map<String, Object> same = workoutService.logSets(u, req(id, new double[][]{{62.5, 8}}));
        assertEquals(false, same.get("newPR"));                        // matching the best is not a PR
        Map<String, Object> better = workoutService.logSets(u, req(id, new double[][]{{60, 10}, {67.5, 5}}));
        assertEquals(true, better.get("newPR"));
        long flagged = workoutLogRepository.findByUserId(u.getId()).stream().filter(WorkoutLog::isNewPR).count();
        assertEquals(1, flagged);                                      // only the 67.5 kg set carries the tag
    }

    @Test
    void historyGroupsSetsByDay() {
        User u = user("hist@test.dev");
        Long id = benchId();
        workoutService.logSets(u, req(id, new double[][]{{60, 10}, {65, 6}}));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sessions = (List<Map<String, Object>>) workoutService.getExerciseHistory(u, id).get("sessions");
        assertEquals(1, sessions.size());
        assertEquals(2, ((List<?>) sessions.get(0).get("sets")).size());
        assertEquals(65.0, sessions.get(0).get("topWeightKg"));
        assertEquals(990.0, sessions.get(0).get("volumeKg"));          // 60×10 + 65×6
    }
}
