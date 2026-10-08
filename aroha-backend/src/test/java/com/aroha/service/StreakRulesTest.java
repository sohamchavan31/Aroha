package com.aroha.service;

import com.aroha.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class StreakRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 8);

    private static User user(int streak, LocalDate lastActive) {
        User u = new User();
        u.setStreak(streak);
        u.setLastActiveDate(lastActive);
        return u;
    }

    @Test
    void activeTodayOrYesterdayIsActive() {
        assertEquals(StreakRules.ACTIVE, StreakRules.status(user(5, TODAY), TODAY).state());
        assertEquals(StreakRules.ACTIVE, StreakRules.status(user(5, TODAY.minusDays(1)), TODAY).state());
    }

    @Test
    void oneMissedDayFreezesTheStreak() {
        StreakRules.Status s = StreakRules.status(user(12, TODAY.minusDays(2)), TODAY);
        assertEquals(StreakRules.FROZEN, s.state());
        assertEquals(12, s.streak());
        assertEquals(TODAY.minusDays(1), s.missedDay());
        assertEquals(StreakRules.THAW_REPS, s.thawReps());
    }

    @Test
    void twoMissedDaysBreakIt() {
        StreakRules.Status s = StreakRules.status(user(12, TODAY.minusDays(3)), TODAY);
        assertEquals(StreakRules.NONE, s.state());
        assertEquals(0, s.streak());
    }

    @Test
    void aOneDayStreakIsNotWorthFreezing() {
        assertEquals(StreakRules.NONE, StreakRules.status(user(1, TODAY.minusDays(2)), TODAY).state());
    }

    @Test
    void otherActivityWhileFrozenLeavesItFrozen() {
        User u = user(12, TODAY.minusDays(2));
        ActivityService.updateStreak(u, TODAY);
        assertEquals(12, u.getStreak());
        assertEquals(TODAY.minusDays(2), u.getLastActiveDate());
        assertEquals(StreakRules.FROZEN, StreakRules.status(u, TODAY).state());
    }

    @Test
    void thawNeedsEnoughReps() {
        User u = user(12, TODAY.minusDays(2));
        assertFalse(StreakRules.thaw(u, TODAY, 14));
        assertEquals(StreakRules.FROZEN, StreakRules.status(u, TODAY).state());
    }

    @Test
    void thawCarriesTheStreakOnAndCountsToday() {
        User u = user(12, TODAY.minusDays(2));
        assertTrue(StreakRules.thaw(u, TODAY, 15));
        assertEquals(13, u.getStreak());
        assertEquals(TODAY, u.getLastActiveDate());
        assertEquals(TODAY.minusDays(1), u.getLastFreezeDay());
        assertEquals(StreakRules.ACTIVE, StreakRules.status(u, TODAY).state());
        // and tomorrow it continues as normal
        ActivityService.updateStreak(u, TODAY.plusDays(1));
        assertEquals(14, u.getStreak());
    }

    @Test
    void secondFreezeWithinAWeekCostsMore() {
        User u = user(20, TODAY.minusDays(2));
        u.setLastFreezeDay(TODAY.minusDays(5));
        assertEquals(StreakRules.THAW_REPS_REPEAT, StreakRules.status(u, TODAY).thawReps());
        assertFalse(StreakRules.thaw(u, TODAY, 15));
        assertTrue(StreakRules.thaw(u, TODAY, 25));
    }

    @Test
    void freezeAWeekLaterIsBackToNormalPrice() {
        User u = user(20, TODAY.minusDays(2));
        u.setLastFreezeDay(TODAY.minusDays(8));
        assertEquals(StreakRules.THAW_REPS, StreakRules.status(u, TODAY).thawReps());
    }

    @Test
    void nothingToThawWhenActive() {
        assertFalse(StreakRules.thaw(user(5, TODAY.minusDays(1)), TODAY, 50));
    }
}
