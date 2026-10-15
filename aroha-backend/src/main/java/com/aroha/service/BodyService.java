package com.aroha.service;

import com.aroha.dto.MeasurementRequest;
import com.aroha.model.BodyMeasurement;
import com.aroha.model.User;
import com.aroha.model.WeightLog;
import com.aroha.repository.BodyMeasurementRepository;
import com.aroha.repository.UserRepository;
import com.aroha.repository.WeightLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;

/** The Body screen: composition, energy and pace numbers, and tape measurements. */
@Service
@RequiredArgsConstructor
public class BodyService {

    static final List<String> FIELDS = List.of("waistCm", "neckCm", "hipCm", "chestCm", "armCm", "shoulderCm", "thighCm");
    private static final Map<String, Function<BodyMeasurement, Double>> GET = Map.of(
            "waistCm", BodyMeasurement::getWaistCm,
            "neckCm", BodyMeasurement::getNeckCm,
            "hipCm", BodyMeasurement::getHipCm,
            "chestCm", BodyMeasurement::getChestCm,
            "armCm", BodyMeasurement::getArmCm,
            "shoulderCm", BodyMeasurement::getShoulderCm,
            "thighCm", BodyMeasurement::getThighCm);

    private final UserRepository userRepository;
    private final WeightLogRepository weightLogRepository;
    private final BodyMeasurementRepository measurementRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> body(User principal) {
        User u = load(principal);
        List<BodyMeasurement> history = measurementRepository.findByUserIdOrderByLogDateDesc(u.getId());
        Map<String, Object> tape = latestPerField(history);
        Double waist = value(tape, "waistCm"), neck = value(tape, "neckCm"), hip = value(tape, "hipCm");

        Double w = u.getWeightKg(), h = u.getHeightCm();
        String sex = u.getGender();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("sex", sex);
        r.put("age", u.getAge());
        r.put("heightCm", h);
        r.put("weightKg", w);
        r.put("healthGoal", u.getHealthGoal());

        // Composition
        Double bmi = BodyMetrics.bmi(w, h);
        r.put("bmi", bmi);
        r.put("bmiCategory", BodyMetrics.bmiCategory(bmi));
        Double bf = BodyMetrics.navyBodyFat(sex, h, waist, neck, hip);
        r.put("bodyFatPct", bf);
        r.put("bodyFatCategory", BodyMetrics.bodyFatCategory(sex, bf));
        r.put("leanMassKg", BodyMetrics.leanMass(w, bf));
        r.put("fatMassKg", BodyMetrics.fatMass(w, bf));
        r.put("bodyFatNeeds", bodyFatNeeds(sex, waist, neck, hip));
        Double whtr = BodyMetrics.waistToHeight(waist, h);
        r.put("waistToHeight", whtr);
        r.put("waistToHeightCategory", BodyMetrics.waistToHeightCategory(whtr));
        Double whr = BodyMetrics.waistToHip(waist, hip);
        r.put("waistToHip", whr);
        r.put("waistToHipCategory", BodyMetrics.waistToHipCategory(sex, whr));

        // Energy
        Integer bmr = BodyMetrics.bmr(sex, w, h, u.getAge());
        Integer tdee = BodyMetrics.tdee(bmr, u.getActivityLevel());
        r.put("bmr", bmr);
        r.put("tdee", tdee);
        r.put("calorieGoal", u.getDailyCalorieGoal());
        r.put("calorieBalance", tdee == null || u.getDailyCalorieGoal() == null ? null : u.getDailyCalorieGoal() - tdee);

        // Pace: trend over the last 4 weeks of weigh-ins
        List<BodyMetrics.WeighIn> weighIns = weightLogRepository
                .findByUserIdAndLoggedDateAfterOrderByLoggedDateAsc(u.getId(), LocalDate.now().minusDays(29)).stream()
                .map((WeightLog l) -> new BodyMetrics.WeighIn(l.getLoggedDate(), l.getWeightKg())).toList();
        Double kgWeek = BodyMetrics.kgPerWeek(weighIns);
        Double pctWeek = kgWeek == null || w == null || w <= 0 ? null : BodyMetrics.round2(kgWeek / w * 100);
        double[] target = BodyMetrics.targetPctPerWeek(u.getHealthGoal());
        r.put("kgPerWeek", kgWeek);
        r.put("pctPerWeek", pctWeek);
        r.put("targetPctPerWeek", target);
        r.put("paceStatus", paceStatus(pctWeek, target));
        r.put("weighInsUsed", weighIns.size());

        r.put("measurements", tape);
        return r;
    }

    /** Saves today's tape measurements, keeping any already logged today that weren't sent. */
    @Transactional
    public Map<String, Object> saveMeasurements(User principal, MeasurementRequest req) {
        User u = load(principal);
        if (FIELDS.stream().allMatch(f -> requestValue(req, f) == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter at least one measurement");
        }
        LocalDate today = LocalDate.now();
        BodyMeasurement m = measurementRepository.findByUserIdAndLogDate(u.getId(), today)
                .orElseGet(() -> BodyMeasurement.builder().userId(u.getId()).logDate(today).build());
        if (req.getWaistCm() != null) m.setWaistCm(round1(req.getWaistCm()));
        if (req.getNeckCm() != null) m.setNeckCm(round1(req.getNeckCm()));
        if (req.getHipCm() != null) m.setHipCm(round1(req.getHipCm()));
        if (req.getChestCm() != null) m.setChestCm(round1(req.getChestCm()));
        if (req.getArmCm() != null) m.setArmCm(round1(req.getArmCm()));
        if (req.getShoulderCm() != null) m.setShoulderCm(round1(req.getShoulderCm()));
        if (req.getThighCm() != null) m.setThighCm(round1(req.getThighCm()));
        measurementRepository.save(m);
        return body(u);
    }

    @Transactional(readOnly = true)
    public List<BodyMeasurement> history(User principal) {
        return measurementRepository.findByUserIdOrderByLogDateDesc(load(principal).getId());
    }

    // For each measurement: the latest value, when it was taken, and the change since the one before.
    static Map<String, Object> latestPerField(List<BodyMeasurement> newestFirst) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (String f : FIELDS) {
            Double latest = null, previous = null;
            LocalDate date = null;
            for (BodyMeasurement m : newestFirst) {
                Double v = GET.get(f).apply(m);
                if (v == null) continue;
                if (latest == null) { latest = v; date = m.getLogDate(); }
                else { previous = v; break; }
            }
            if (latest != null) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("value", latest);
                e.put("date", date);
                e.put("change", previous == null ? null : BodyMetrics.round1(latest - previous));
                out.put(f, e);
            }
        }
        return out;
    }

    static List<String> bodyFatNeeds(String sex, Double waist, Double neck, Double hip) {
        List<String> needs = new ArrayList<>();
        boolean male = "male".equalsIgnoreCase(sex), female = "female".equalsIgnoreCase(sex);
        if (!male && !female) needs.add("sex");
        if (waist == null) needs.add("waist");
        if (neck == null) needs.add("neck");
        if (female && hip == null) needs.add("hip");
        return needs;
    }

    static String paceStatus(Double pctPerWeek, double[] target) {
        if (pctPerWeek == null) return null;
        double min = target[0], max = target[1];
        if (pctPerWeek >= min && pctPerWeek <= max) return "On track";
        boolean losing = max < 0, gaining = min > 0;
        if (gaining) return pctPerWeek > max ? "Too fast" : pctPerWeek < 0 ? "Losing" : "Too slow";
        if (losing) return pctPerWeek < min ? "Too fast" : pctPerWeek > 0 ? "Gaining" : "Too slow";
        return pctPerWeek > max ? "Gaining" : "Losing";
    }

    @SuppressWarnings("unchecked")
    private static Double value(Map<String, Object> tape, String field) {
        Object e = tape.get(field);
        return e == null ? null : (Double) ((Map<String, Object>) e).get("value");
    }

    private static Double requestValue(MeasurementRequest r, String f) {
        return switch (f) {
            case "waistCm" -> r.getWaistCm();
            case "neckCm" -> r.getNeckCm();
            case "hipCm" -> r.getHipCm();
            case "chestCm" -> r.getChestCm();
            case "armCm" -> r.getArmCm();
            case "shoulderCm" -> r.getShoulderCm();
            default -> r.getThighCm();
        };
    }

    private static double round1(double v) { return BodyMetrics.round1(v); }

    private User load(User principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }
}
