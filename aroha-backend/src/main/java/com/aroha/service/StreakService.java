package com.aroha.service;

import com.aroha.dto.ThawRequest;
import com.aroha.model.User;
import com.aroha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserRepository userRepository;
    private final ActivityService activityService;

    public Map<String, Object> thaw(User principal, ThawRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        LocalDate today = LocalDate.now();
        StreakRules.Status before = StreakRules.status(user, today);

        if (!StreakRules.FROZEN.equals(before.state())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your streak isn't frozen.");
        }
        if (!StreakRules.thaw(user, today, request.getReps())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Do at least " + before.thawReps() + " reps to thaw your streak.");
        }
        userRepository.save(user);
        activityService.recordActivity(user); // the thaw is today's activity: let auto missions check in

        return Map.of(
                "streak", user.getStreak(),
                "streakState", StreakRules.ACTIVE,
                "reps", request.getReps(),
                "exercise", request.getExercise());
    }
}
