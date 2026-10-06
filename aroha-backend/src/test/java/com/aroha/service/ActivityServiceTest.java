package com.aroha.service;

import com.aroha.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActivityServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 6);

    private static User user(int streak, LocalDate lastActive) {
        User u = new User();
        u.setStreak(streak);
        u.setLastActiveDate(lastActive);
        return u;
    }

    @Test
    void firstActivityEverStartsAtOne() {
        User u = user(0, null);
        ActivityService.updateStreak(u, TODAY);
        assertEquals(1, u.getStreak());
        assertEquals(TODAY, u.getLastActiveDate());
    }

    @Test
    void activeYesterdayAddsOne() {
        User u = user(4, TODAY.minusDays(1));
        ActivityService.updateStreak(u, TODAY);
        assertEquals(5, u.getStreak());
    }

    @Test
    void secondActivitySameDayChangesNothing() {
        User u = user(5, TODAY);
        ActivityService.updateStreak(u, TODAY);
        assertEquals(5, u.getStreak());
    }

    @Test
    void gapResetsToOne() {
        User u = user(9, TODAY.minusDays(3));
        ActivityService.updateStreak(u, TODAY);
        assertEquals(1, u.getStreak());
        assertEquals(TODAY, u.getLastActiveDate());
    }
}
