package com.aroha.service;

import com.aroha.model.User;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Streak freeze, Aroha style: miss one day and the streak freezes instead of
 * breaking. Thaw it before the end of the next day with extra push-ups or
 * pull-ups — 15 reps, or 25 if you already thawed one in the past week.
 * Two missed days in a row, or an unthawed freeze, breaks it.
 */
public final class StreakRules {

    public static final String ACTIVE = "ACTIVE";
    public static final String FROZEN = "FROZEN";
    public static final String NONE   = "NONE";

    public static final int MIN_STREAK_TO_FREEZE = 2;
    public static final int THAW_REPS = 15;
    public static final int THAW_REPS_REPEAT = 25;

    /** state, the streak to show, and for FROZEN the missed day and reps needed. */
    public record Status(String state, int streak, LocalDate missedDay, int thawReps) {}

    private StreakRules() {}

    public static Status status(User user, LocalDate today) {
        LocalDate last = user.getLastActiveDate();
        if (last == null) return new Status(NONE, 0, null, 0);
        if (!last.isBefore(today.minusDays(1))) return new Status(ACTIVE, user.getStreak(), null, 0);
        if (isFrozen(user, today)) {
            LocalDate missed = today.minusDays(1);
            return new Status(FROZEN, user.getStreak(), missed, thawReps(user, missed));
        }
        return new Status(NONE, 0, null, 0);
    }

    /** Exactly yesterday was missed, on a streak worth saving. */
    static boolean isFrozen(User user, LocalDate today) {
        LocalDate last = user.getLastActiveDate();
        return last != null && last.equals(today.minusDays(2)) && user.getStreak() >= MIN_STREAK_TO_FREEZE;
    }

    static int thawReps(User user, LocalDate missedDay) {
        LocalDate prev = user.getLastFreezeDay();
        boolean repeat = prev != null && ChronoUnit.DAYS.between(prev, missedDay) < 7;
        return repeat ? THAW_REPS_REPEAT : THAW_REPS;
    }

    /**
     * Applies a thaw: the streak carries on as if yesterday was kept, and today
     * counts as active. Returns false if there's nothing to thaw or too few reps.
     */
    static boolean thaw(User user, LocalDate today, int reps) {
        Status s = status(user, today);
        if (!FROZEN.equals(s.state()) || reps < s.thawReps()) return false;
        user.setStreak(user.getStreak() + 1);
        user.setLastActiveDate(today);
        user.setLastFreezeDay(s.missedDay());
        return true;
    }
}
