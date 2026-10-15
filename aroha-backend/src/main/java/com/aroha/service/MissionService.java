package com.aroha.service;

import com.aroha.dto.CompleteResponse;
import com.aroha.dto.MissionResponse;
import com.aroha.model.EvolutionLog;
import com.aroha.model.Mission;
import com.aroha.model.User;
import com.aroha.repository.EvolutionLogRepository;
import com.aroha.repository.HabitLogRepository;
import com.aroha.repository.MissionRepository;
import com.aroha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final HabitLogRepository habitLogRepository;
    private final EvolutionLogRepository evolutionLogRepository;

    // ── EP thresholds ────────────────────────────────────────────────────────
    private static final int[] EP_THRESHOLDS = {0, 1000, 3000, 6000, 11000, 18000, 28000};
    private static final String[] STAGES = {"Spark", "Awakened", "Ascender", "Guardian", "Titan", "Apex", "Legend"};

    // ── Mission pool: category → list of [title, epReward, key] ──────────────
    // Every mission can be checked (see AutoMission): it completes itself from
    // the user's logs, runs on an in-app timer, or can only be ticked after 8 PM.
    private static final Map<String, List<String[]>> POOL = Map.of(
        "STRENGTH", List.of(
            new String[]{"Complete a 20-minute workout", "40", AutoMission.WORKOUT_20},
            new String[]{"Do 3 sets of push-ups", "30", AutoMission.PUSHUPS_3},
            new String[]{"Complete a full workout session", "45", AutoMission.SESSION_DONE},
            new String[]{"Stretch for 10 minutes", "25", AutoMission.TIMER_10}
        ),
        "DISCIPLINE", List.of(
            new String[]{"Complete all your habits today", "50", AutoMission.ALL_HABITS},
            new String[]{"Meditate for 5 minutes", "30", AutoMission.TIMER_5},
            new String[]{"Check in before 8 AM", "30", AutoMission.CHECKIN_EARLY},
            new String[]{"Plan tomorrow: add 3 tasks", "25", AutoMission.PLAN_TOMORROW}
        ),
        "RECOVERY", List.of(
            new String[]{"Log 7+ hours of sleep", "40", AutoMission.SLEEP_7H},
            new String[]{"Hit your water goal", "30", AutoMission.WATER_GOAL},
            new String[]{"Do 5 minutes of deep breathing", "25", AutoMission.TIMER_5},
            new String[]{"Log last night's sleep", "20", AutoMission.SLEEP_LOGGED},
            new String[]{"Weigh in today", "20", AutoMission.WEIGHED_IN}
        ),
        "NUTRITION", List.of(
            new String[]{"Log breakfast, lunch and dinner", "40", AutoMission.MEALS_LOGGED},
            new String[]{"Eat a protein-rich breakfast (20 g+)", "35", AutoMission.BREAKFAST_PROTEIN},
            new String[]{"No junk food today", "45", AutoMission.EVENING},
            new String[]{"Stay within your calorie goal", "50", AutoMission.CALORIES_ON_TARGET},
            new String[]{"Add fruit or vegetables to a meal", "30", AutoMission.FRUIT_VEG}
        )
    );

    // ── Get today's missions — generate if none exist yet ───────────────────
    public List<MissionResponse> getTodayMissions(String email) {
        User user = getUser(email);
        LocalDate today = LocalDate.now();

        List<Mission> existing = missionRepository.findByUserIdAndMissionDate(user.getId(), today);
        if (!existing.isEmpty()) {
            return toResponseList(existing);
        }

        List<Mission> generated = generateDaily(user.getId(), today);
        missionRepository.saveAll(generated);
        return toResponseList(generated);
    }

    // ── Complete a mission — award EP, update attribute, check stage-up ──────
    // Ticking by hand is only allowed where the server can stand behind it.
    @Transactional
    public CompleteResponse completeMission(Long missionId, String email) {
        return completeMission(missionId, email, LocalDateTime.now());
    }

    @Transactional
    CompleteResponse completeMission(Long missionId, String email, LocalDateTime now) {
        User user = getUser(email);
        Mission mission = ownMission(missionId, user);
        if (mission.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mission already completed");
        }
        String key = mission.getAutoKey();
        switch (AutoMission.kind(key)) {
            case AUTO -> throw bad("This one ticks itself: " + lowerFirst(AutoMission.hint(key)) + ".");
            case TIMER -> {
                int minutes = AutoMission.timerMinutes(key);
                // a few seconds of slack for the phone's clock and the network
                if (mission.getStartedAt() == null
                        || mission.getStartedAt().plusMinutes(minutes).minusSeconds(15).isAfter(now)) {
                    throw bad("Finish the " + minutes + "-minute timer first.");
                }
            }
            case EVENING -> {
                if (now.getHour() < AutoMission.EVENING_HOUR) {
                    throw bad("Tick this after 8 PM, once the day's eating is done.");
                }
            }
            case MANUAL -> { }
        }
        return complete(user, mission);
    }

    /** Starts (or restarts) a timed mission's timer. */
    @Transactional
    public MissionResponse startTimer(Long missionId, String email) {
        User user = getUser(email);
        Mission mission = ownMission(missionId, user);
        if (AutoMission.kind(mission.getAutoKey()) != AutoMission.Kind.TIMER) {
            throw bad("This mission doesn't have a timer.");
        }
        if (mission.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mission already completed");
        }
        mission.setStartedAt(LocalDateTime.now());
        return toResponse(missionRepository.save(mission));
    }

    private Mission ownMission(Long missionId, User user) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission not found"));
        if (!mission.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your mission");
        }
        return mission;
    }

    // 400, not 401/403: the app treats those as "session expired".
    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static String lowerFirst(String s) {
        return s == null || s.isEmpty() ? "" : Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }

    // ── Mark done, award EP, bump the attribute and log a stage-up if any ────
    // Shared by the manual endpoint and AutoMissionService. Saves the user.
    @Transactional
    public CompleteResponse complete(User user, Mission mission) {
        mission.setCompleted(true);
        mission.setCompletedAt(LocalDateTime.now());
        missionRepository.save(mission);

        String oldStage = user.getEvolutionStage();
        user.setEvolutionPoints(user.getEvolutionPoints() + mission.getEpReward());
        updateAttribute(user, mission.getCategory());
        String newStage = stageForEP(user.getEvolutionPoints());
        user.setEvolutionStage(newStage);
        userRepository.save(user);

        boolean stagedUp = !oldStage.equals(newStage);

        if (stagedUp) {
            evolutionLogRepository.save(EvolutionLog.builder()
                    .userId(user.getId())
                    .fromStage(oldStage)
                    .toStage(newStage)
                    .epAtStageUp(user.getEvolutionPoints())
                    .stagedUpAt(LocalDateTime.now())
                    .build());
        }

        return CompleteResponse.builder()
                .missionId(mission.getId())
                .epEarned(mission.getEpReward())
                .totalEP(user.getEvolutionPoints())
                .evolutionStage(newStage)
                .stagedUp(stagedUp)
                .newStage(stagedUp ? newStage : null)
                .strengthAttr(user.getStrengthAttr())
                .disciplineAttr(user.getDisciplineAttr())
                .recoveryAttr(user.getRecoveryAttr())
                .nutritionAttr(user.getNutritionAttr())
                .build();
    }

    // ── Consistency Score: % of last 30 days with at least 1 habit completed ─
    public int getConsistencyScore(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(29);
        var logs = habitLogRepository.findByUserIdAndLogDateBetween(userId, thirtyDaysAgo, today);
        long activeDays = logs.stream()
                .map(log -> log.getLogDate())
                .distinct()
                .count();
        return (int) Math.round((activeDays / 30.0) * 100);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private List<Mission> generateDaily(Long userId, LocalDate date) {
        // Rotate categories based on day: covers all 4 over the week
        String[] cats = pickCategories(date);
        List<Mission> missions = new ArrayList<>();
        for (int i = 0; i < cats.length; i++) {
            String cat = cats[i];
            List<String[]> pool = POOL.get(cat);
            // Deterministic pick based on userId + date + index
            int idx = (int) ((userId + date.toEpochDay() + i) % pool.size());
            String[] entry = pool.get(idx);
            missions.add(Mission.builder()
                    .userId(userId)
                    .title(entry[0])
                    .type("DAILY")
                    .category(cat)
                    .epReward(Integer.parseInt(entry[1]))
                    .completed(false)
                    .missionDate(date)
                    .autoKey(entry.length > 2 ? entry[2] : null)
                    .build());
        }
        return missions;
    }

    private String[] pickCategories(LocalDate date) {
        // 4-day rotation ensuring all categories appear across the week
        return switch (date.getDayOfMonth() % 4) {
            case 0 -> new String[]{"STRENGTH", "DISCIPLINE", "NUTRITION"};
            case 1 -> new String[]{"STRENGTH", "DISCIPLINE", "RECOVERY"};
            case 2 -> new String[]{"STRENGTH", "NUTRITION", "RECOVERY"};
            default -> new String[]{"DISCIPLINE", "NUTRITION", "RECOVERY"};
        };
    }

    private void updateAttribute(User user, String category) {
        switch (category) {
            case "STRENGTH"   -> user.setStrengthAttr(Math.min(100, user.getStrengthAttr() + 2));
            case "DISCIPLINE" -> user.setDisciplineAttr(Math.min(100, user.getDisciplineAttr() + 2));
            case "RECOVERY"   -> user.setRecoveryAttr(Math.min(100, user.getRecoveryAttr() + 2));
            case "NUTRITION"  -> user.setNutritionAttr(Math.min(100, user.getNutritionAttr() + 2));
        }
    }

    private String stageForEP(int ep) {
        String stage = STAGES[0];
        for (int i = 0; i < EP_THRESHOLDS.length; i++) {
            if (ep >= EP_THRESHOLDS[i]) stage = STAGES[i];
        }
        return stage;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private List<MissionResponse> toResponseList(List<Mission> missions) {
        return missions.stream().map(MissionService::toResponse).toList();
    }

    static MissionResponse toResponse(Mission m) {
        AutoMission.Kind kind = AutoMission.kind(m.getAutoKey());
        return MissionResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .type(m.getType())
                .category(m.getCategory())
                .epReward(m.getEpReward())
                .completed(m.isCompleted())
                .auto(kind == AutoMission.Kind.AUTO)
                .kind(kind.name())
                .hint(AutoMission.hint(m.getAutoKey()))
                .minutes(AutoMission.timerMinutes(m.getAutoKey()))
                .startedAt(m.getStartedAt())
                .build();
    }
}
