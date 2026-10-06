package com.aroha.service;

import com.aroha.model.User;

/**
 * Daily calorie and macro targets from the user's body stats, activity, goal and pace.
 * Used when the profile is saved and when a new weigh-in changes the user's weight.
 */
public final class MacroCalculator {

    private MacroCalculator() {}

    /** Recomputes macro targets and stores them on the user entity (call before save). */
    public static void apply(User user) {
        Double w = user.getWeightKg();
        Double h = user.getHeightCm();
        Integer a = user.getAge();
        if (w == null || h == null || a == null) return;

        // Mifflin-St Jeor BMR
        double bmr = "female".equalsIgnoreCase(user.getGender())
                ? (10 * w) + (6.25 * h) - (5 * a) - 161
                : (10 * w) + (6.25 * h) - (5 * a) + 5;

        // Activity multiplier
        double actMult = switch (user.getActivityLevel() != null ? user.getActivityLevel() : "sedentary") {
            case "lightly_active"    -> 1.375;
            case "moderately_active" -> 1.55;
            case "very_active"       -> 1.725;
            case "athlete"           -> 1.9;
            default                  -> 1.2;
        };
        int tdee = (int) Math.round(bmr * actMult);

        // Calorie goal — bulk/cut speed overrides fixed delta
        String goal  = user.getHealthGoal() != null ? user.getHealthGoal() : "general_fitness";
        String speed = user.getWeightChangeSpeed();

        int calorieGoal = switch (goal) {
            case "lose_weight", "reduce_body_fat" -> switch (speed != null ? speed : "moderate_cut") {
                case "slow_cut"       -> tdee - 200;
                case "aggressive_cut" -> tdee - 600;
                default               -> tdee - 400;
            };
            case "gain_muscle", "gain_weight" -> switch (speed != null ? speed : "lean_bulk") {
                case "slow_bulk"       -> tdee + 150;
                case "aggressive_bulk" -> tdee + 400;
                default                -> tdee + 250;
            };
            case "increase_strength" -> tdee + 150;
            case "endurance"         -> tdee + 200;
            default                  -> tdee;
        };
        calorieGoal = Math.max(1200, calorieGoal);

        // Protein g/kg
        double proteinPerKg = switch (goal) {
            case "lose_weight", "reduce_body_fat"   -> 2.2;
            case "gain_muscle", "gain_weight"       -> 2.0;
            case "increase_strength"                -> 2.0;
            case "endurance"                        -> 1.8;
            default                                 -> 1.6;
        };
        int proteinGoal = (int) Math.round(w * proteinPerKg);

        // Fat ~0.9 g/kg
        int fatGoal = (int) Math.round(w * 0.9);

        // Carbs from remaining calories
        int carbCalories = calorieGoal - (proteinGoal * 4 + fatGoal * 9);
        int carbGoal = Math.max(50, (int) Math.round(carbCalories / 4.0));

        user.setDailyCalorieGoal(calorieGoal);
        user.setDailyProteinGoal(proteinGoal);
        user.setDailyCarbGoal(carbGoal);
        user.setDailyFatGoal(fatGoal);
    }
}
