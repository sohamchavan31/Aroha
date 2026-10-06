package com.aroha.service;

import com.aroha.model.DailyLog;
import com.aroha.model.Habit;
import com.aroha.model.User;
import com.aroha.repository.DailyLogRepository;
import com.aroha.repository.HabitRepository;
import com.aroha.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AccountServiceTest {

    @Autowired AccountService accountService;
    @Autowired UserRepository userRepository;
    @Autowired DailyLogRepository dailyLogRepository;
    @Autowired HabitRepository habitRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User newUser(String email) {
        User u = userRepository.save(User.builder()
                .email(email).name("Test").password(passwordEncoder.encode("secret123"))
                .evolutionStage("Spark").evolutionPoints(0).streak(0).profileComplete(false)
                .build());
        dailyLogRepository.save(DailyLog.builder().userId(u.getId()).mealId(1L).mealName("Poha")
                .servingGrams(150).calories(200).logDate(LocalDate.now()).build());
        habitRepository.save(Habit.builder().userId(u.getId()).name("Read").color("#A78BFA").icon("book-outline").build());
        return u;
    }

    @Test
    void exportHasDataButNoPassword() {
        User u = newUser("export@test.dev");
        Map<String, Object> data = accountService.exportData(u);
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) data.get("profile");
        assertEquals("export@test.dev", profile.get("email"));
        assertFalse(profile.containsKey("password"));
        assertEquals(1, ((java.util.List<?>) data.get("foodLog")).size());
        assertEquals(1, ((java.util.List<?>) data.get("habits")).size());
    }

    @Test
    void wrongPasswordKeepsEverything() {
        User u = newUser("keep@test.dev");
        assertThrows(ResponseStatusException.class, () -> accountService.deleteAccount(u, "nope"));
        assertTrue(userRepository.findById(u.getId()).isPresent());
        assertEquals(1, dailyLogRepository.findByUserId(u.getId()).size());
    }

    @Test
    void deleteRemovesUserAndTheirData() {
        User u = newUser("delete@test.dev");
        User other = newUser("other@test.dev");

        accountService.deleteAccount(u, "secret123");

        assertTrue(userRepository.findById(u.getId()).isEmpty());
        assertTrue(dailyLogRepository.findByUserId(u.getId()).isEmpty());
        assertTrue(habitRepository.findByUserId(u.getId()).isEmpty());
        // Other users are untouched.
        assertEquals(1, dailyLogRepository.findByUserId(other.getId()).size());
    }
}
