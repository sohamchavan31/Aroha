package com.aroha.service;

import com.aroha.model.User;
import com.aroha.model.WorkoutLog;

import java.util.List;

/**
 * Turns sets logged by hand in Train into training time and calories, so they
 * count on Home, Progress and missions the same way a generated session does.
 * A set is about 2.5 minutes with its rest; lifting is about 5 MET.
 */
public final class Training {

    public static final double MINUTES_PER_SET = 2.5;
    static final double STRENGTH_MET = 5.0;
    static final double DEFAULT_WEIGHT_KG = 70;

    private Training() {}

    /** Sets in these log rows (old rows stored several sets in one). */
    public static int sets(List<WorkoutLog> logs) {
        return logs.stream().mapToInt(l -> Math.max(1, l.getSets())).sum();
    }

    public static int minutes(int sets) {
        return (int) Math.round(sets * MINUTES_PER_SET);
    }

    public static double kcalForSets(int sets, User user) {
        double kg = user.getWeightKg() != null && user.getWeightKg() > 0 ? user.getWeightKg() : DEFAULT_WEIGHT_KG;
        return STRENGTH_MET * kg * (sets * MINUTES_PER_SET / 60.0);
    }

    /**
     * Calories burned in a day. A generated session also logs its sets, so the
     * two overlap: take the larger instead of adding them.
     */
    public static double burned(double sessionKcal, int sets, User user) {
        return Math.max(sessionKcal, kcalForSets(sets, user));
    }
}
