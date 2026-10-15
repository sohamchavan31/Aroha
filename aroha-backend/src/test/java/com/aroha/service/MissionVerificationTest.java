package com.aroha.service;

import com.aroha.model.Mission;
import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import com.aroha.repository.MissionRepository;
import com.aroha.repository.UserRepository;
import com.aroha.repository.WorkoutLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** Missions can only be completed when the app can stand behind it. */
@SpringBootTest
class MissionVerificationTest {

    @Autowired MissionService missionService;
    @Autowired ActivityService activityService;
    @Autowired MissionRepository missionRepository;
    @Autowired UserRepository userRepository;
    @Autowired WorkoutLogRepository workoutLogRepository;

    private static final LocalDate DAY = LocalDate.now();

    private User user(String email) {
        return userRepository.save(User.builder().email(email).password("x").name("T")
                .evolutionStage("Spark").profileComplete(true).dailyCalorieGoal(2000).build());
    }

    private Mission mission(User u, String key) {
        return missionRepository.save(Mission.builder().userId(u.getId()).title("t").type("DAILY")
                .category("DISCIPLINE").epReward(30).completed(false).missionDate(DAY).autoKey(key).build());
    }

    private boolean done(Mission m) {
        return missionRepository.findById(m.getId()).orElseThrow().isCompleted();
    }

    @Test
    void automaticMissionsCantBeTickedByHand() {
        User u = user("mv-auto@example.com");
        Mission m = mission(u, AutoMission.PUSHUPS_3);
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> missionService.completeMission(m.getId(), u.getEmail(), DAY.atTime(12, 0)));
        assertTrue(e.getReason().contains("push-ups"));
        assertFalse(done(m));
    }

    @Test
    void timedMissionNeedsItsMinutesToPass() {
        User u = user("mv-timer@example.com");
        Mission m = mission(u, AutoMission.TIMER_5);
        // not started
        assertThrows(ResponseStatusException.class,
                () -> missionService.completeMission(m.getId(), u.getEmail(), DAY.atTime(12, 0)));
        // started just now
        missionService.startTimer(m.getId(), u.getEmail());
        LocalDateTime started = missionRepository.findById(m.getId()).orElseThrow().getStartedAt();
        assertNotNull(started);
        assertThrows(ResponseStatusException.class,
                () -> missionService.completeMission(m.getId(), u.getEmail(), started.plusMinutes(2)));
        // five minutes later
        missionService.completeMission(m.getId(), u.getEmail(), started.plusMinutes(5));
        assertTrue(done(m));
    }

    @Test
    void eveningMissionOnlyAfter8pm() {
        User u = user("mv-evening@example.com");
        Mission m = mission(u, AutoMission.EVENING);
        assertThrows(ResponseStatusException.class,
                () -> missionService.completeMission(m.getId(), u.getEmail(), DAY.atTime(19, 59)));
        missionService.completeMission(m.getId(), u.getEmail(), DAY.atTime(20, 0));
        assertTrue(done(m));
    }

    @Test
    void pushUpsTickThemselvesFromTrainLogs() {
        User u = user("mv-push@example.com");
        Mission m = mission(u, AutoMission.PUSHUPS_3);
        workoutLogRepository.save(WorkoutLog.builder().userId(u.getId()).exerciseId(1L).exerciseName("Push-Ups")
                .sets(2).reps(12).logDate(DAY).loggedAt(DAY.atTime(9, 0)).build());
        activityService.completeMetMissions(u, DAY.atTime(9, 1));
        assertFalse(done(m), "2 sets isn't 3");
        workoutLogRepository.save(WorkoutLog.builder().userId(u.getId()).exerciseId(1L).exerciseName("Diamond Push Up")
                .sets(1).reps(10).logDate(DAY).loggedAt(DAY.atTime(9, 5)).build());
        activityService.completeMetMissions(u, DAY.atTime(9, 6));
        assertTrue(done(m));
    }

    @Test
    void earlyCheckInOnlyBefore8am() {
        User late = user("mv-late@example.com");
        Mission lateMission = mission(late, AutoMission.CHECKIN_EARLY);
        activityService.completeMetMissions(late, DAY.atTime(8, 0));
        assertFalse(done(lateMission));

        User early = user("mv-early@example.com");
        Mission earlyMission = mission(early, AutoMission.CHECKIN_EARLY);
        activityService.completeMetMissions(early, DAY.atTime(7, 45));
        assertTrue(done(earlyMission));
    }

    @Test
    void calorieGoalIsJudgedAfter8pmOnly() {
        User u = user("mv-kcal@example.com"); // goal 2000, nothing eaten
        Mission m = mission(u, AutoMission.CALORIES_ON_TARGET);
        activityService.completeMetMissions(u, DAY.atTime(21, 0));
        assertFalse(done(m), "an empty day isn't 'within the goal'");
    }

    @Test
    void pushUpNames() {
        assertTrue(ActivityService.isPushUp("Push-ups"));
        assertTrue(ActivityService.isPushUp("Incline Push Up"));
        assertTrue(ActivityService.isPushUp("pushups"));
        assertFalse(ActivityService.isPushUp("Pull-ups"));
        assertFalse(ActivityService.isPushUp(null));
    }
}
