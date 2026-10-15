package com.aroha.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Body-composition and energy numbers from the user's stats and tape
 * measurements. Everything here is an estimate; the app says so next to
 * each number. Lengths in cm, weights in kg.
 */
public final class BodyMetrics {

    private BodyMetrics() {}

    // ── BMI ──────────────────────────────────────────────────────────────────

    public static Double bmi(Double weightKg, Double heightCm) {
        if (weightKg == null || heightCm == null || heightCm <= 0) return null;
        double m = heightCm / 100.0;
        return round1(weightKg / (m * m));
    }

    /**
     * Asia-Pacific cut-offs (WHO, used in India): risk starts at a lower BMI
     * for South Asian bodies than the global 25/30 cut-offs suggest.
     */
    public static String bmiCategory(Double bmi) {
        if (bmi == null) return null;
        if (bmi < 18.5) return "Underweight";
        if (bmi < 23.0) return "Normal";
        if (bmi < 25.0) return "Overweight";
        return "Obese";
    }

    // ── Body fat: U.S. Navy tape method ──────────────────────────────────────

    /** Body-fat percent (0–100) from tape measurements, or null if any is missing. */
    public static Double navyBodyFat(String gender, Double heightCm, Double waistCm, Double neckCm, Double hipCm) {
        if (heightCm == null || waistCm == null || neckCm == null) return null;
        double bf;
        if ("male".equalsIgnoreCase(gender)) {
            if (waistCm - neckCm <= 0) return null;
            bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
        } else if ("female".equalsIgnoreCase(gender)) {
            if (hipCm == null || waistCm + hipCm - neckCm <= 0) return null;
            bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
        } else {
            return null; // the formula needs a sex
        }
        if (Double.isNaN(bf) || bf < 2 || bf > 70) return null; // implausible tape numbers
        return round1(bf);
    }

    /** American Council on Exercise bands. */
    public static String bodyFatCategory(String gender, Double bf) {
        if (bf == null) return null;
        boolean female = "female".equalsIgnoreCase(gender);
        if (bf < (female ? 14 : 6)) return "Essential";
        if (bf < (female ? 21 : 14)) return "Athletic";
        if (bf < (female ? 25 : 18)) return "Fit";
        if (bf < (female ? 32 : 25)) return "Average";
        return "High";
    }

    public static Double leanMass(Double weightKg, Double bodyFatPct) {
        return weightKg == null || bodyFatPct == null ? null : round1(weightKg * (1 - bodyFatPct / 100));
    }

    public static Double fatMass(Double weightKg, Double bodyFatPct) {
        return weightKg == null || bodyFatPct == null ? null : round1(weightKg * bodyFatPct / 100);
    }

    // ── Waist ratios ─────────────────────────────────────────────────────────

    public static Double waistToHeight(Double waistCm, Double heightCm) {
        return waistCm == null || heightCm == null || heightCm <= 0 ? null : round2(waistCm / heightCm);
    }

    /** "Keep your waist under half your height." */
    public static String waistToHeightCategory(Double whtr) {
        if (whtr == null) return null;
        if (whtr < 0.4) return "Slim";
        if (whtr < 0.5) return "Healthy";
        if (whtr < 0.6) return "Increased risk";
        return "High risk";
    }

    public static Double waistToHip(Double waistCm, Double hipCm) {
        return waistCm == null || hipCm == null || hipCm <= 0 ? null : round2(waistCm / hipCm);
    }

    /** WHO: abdominal obesity above 0.90 (men) / 0.85 (women). */
    public static String waistToHipCategory(String gender, Double whr) {
        if (whr == null) return null;
        double limit = "female".equalsIgnoreCase(gender) ? 0.85 : 0.90;
        return whr < limit ? "Healthy" : "Increased risk";
    }

    // ── Energy ───────────────────────────────────────────────────────────────

    /** Mifflin-St Jeor, the same formula the calorie targets use. */
    public static Integer bmr(String gender, Double weightKg, Double heightCm, Integer age) {
        if (weightKg == null || heightCm == null || age == null) return null;
        double base = 10 * weightKg + 6.25 * heightCm - 5 * age;
        return (int) Math.round("female".equalsIgnoreCase(gender) ? base - 161 : base + 5);
    }

    public static double activityFactor(String activityLevel) {
        return switch (activityLevel != null ? activityLevel : "sedentary") {
            case "lightly_active"    -> 1.375;
            case "moderately_active" -> 1.55;
            case "very_active"       -> 1.725;
            case "athlete"           -> 1.9;
            default                  -> 1.2;
        };
    }

    public static Integer tdee(Integer bmr, String activityLevel) {
        return bmr == null ? null : (int) Math.round(bmr * activityFactor(activityLevel));
    }

    // ── Rate of weight change ────────────────────────────────────────────────

    public record WeighIn(LocalDate date, double kg) {}

    /**
     * kg per week from the least-squares slope through the weigh-ins, so one
     * heavy morning doesn't swing it. Needs 2+ weigh-ins at least 7 days apart.
     */
    public static Double kgPerWeek(List<WeighIn> logs) {
        if (logs == null || logs.size() < 2) return null;
        LocalDate first = logs.stream().map(WeighIn::date).min(LocalDate::compareTo).orElseThrow();
        LocalDate last = logs.stream().map(WeighIn::date).max(LocalDate::compareTo).orElseThrow();
        if (ChronoUnit.DAYS.between(first, last) < 7) return null;
        int n = logs.size();
        double sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (WeighIn w : logs) {
            double x = ChronoUnit.DAYS.between(first, w.date());
            sx += x; sy += w.kg(); sxx += x * x; sxy += x * w.kg();
        }
        double denom = n * sxx - sx * sx;
        if (denom == 0) return null;
        double perDay = (n * sxy - sx * sy) / denom;
        return round2(perDay * 7);
    }

    /** Healthy weekly change for the goal, as % of body weight: [min, max] (negative = loss). */
    public static double[] targetPctPerWeek(String healthGoal) {
        return switch (healthGoal != null ? healthGoal : "general_fitness") {
            case "gain_muscle", "gain_weight" -> new double[]{0.1, 0.25};   // lean bulk
            case "lose_weight", "reduce_body_fat" -> new double[]{-1.0, -0.5};
            default -> new double[]{-0.1, 0.1};                              // maintain
        };
    }

    static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
