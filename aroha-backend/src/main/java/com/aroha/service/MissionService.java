package com.aroha.service;

import com.aroha.dto.CompleteResponse;
import com.aroha.dto.MissionResponse;
import com.aroha.model.Mission;
import com.aroha.model.User;
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

    // ── EP thresholds ────────────────────────────────────────────────────────
    private static final int[] EP_THRESHOLDS = {0, 1000, 3000, 6000, 11000, 18000, 28000};
    private static final String[] STAGES = {"Spark", "Awakened", "Ascender", "Guardian", "Titan", "Apex", "Legend"};

    // ── Mission pool: category → list of [title, epReward] ──────────────────
    private static final Map<String, List<String[]>> POOL = Map.of(
        "STRENGTH", List.of(
            new String[]{"Complete a 20-minute workout", "40"},
            new String[]{"Do 3 sets of push-ups", "30"},
            new String[]{"Walk 5,000 steps", "35"},
            new String[]{"Complete a full workout session", "45"},
            new String[]{"Do 10 minutes of stretching", "25"}
        ),
        "DISCIPLINE", List.of(
            new String[]{"Complete all your habits today", "50"},
            new String[]{"Meditate for 5 minutes", "30"},
            new String[]{"No screen time after 10 PM", "30"},
            new String[]{"Wake up before 8 AM", "30"},
            new String[]{"Journal for 5 minutes", "25"}
        ),
        "RECOVERY", List.of(
            new String[]{"Sleep 7+ hours tonight", "40"},
            new String[]{"Take a 10-minute rest break", "25"},
            new String[]{"Do 5 minutes of deep breathing", "25"},
            new String[]{"Log your sleep tonight", "20"},
            new String[]{"Go screen-free for 30 minutes", "30"}
        ),
        "NUTRITION", List.of(
            new String[]{"Log all your meals today", "40"},
            new String[]{"Eat a protein-rich breakfast", "35"},
            new String[]{"No junk food today", "45"},
            new String[]{"Stay within your calorie goal", "50"},
            new String[]{"Add fruit or vegetables to a meal", "30"}
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
    @Transactional
    public CompleteResponse completeMission(Long missionId, String email) {
        User user = getUser(email);

        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission not found"));

        if (!mission.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your mission");
        }
        if (mission.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mission already completed");
        }

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

        return CompleteResponse.builder()
                .missionId(missionId)
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
        return missions.stream()
                .map(m -> MissionResponse.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .type(m.getType())
                        .category(m.getCategory())
                        .epReward(m.getEpReward())
                        .completed(m.isCompleted())
                        .build())
                .toList();
    }
}
