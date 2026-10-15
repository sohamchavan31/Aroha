package com.aroha.service;

import com.aroha.dto.MeasurementRequest;
import com.aroha.model.BodyMeasurement;
import com.aroha.model.User;
import com.aroha.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BodyMetricsTest {

    @Autowired BodyService bodyService;
    @Autowired UserRepository userRepository;

    @Test
    void bmiUsesAsianCutoffs() {
        assertEquals(22.9, BodyMetrics.bmi(70.0, 175.0));
        assertEquals("Underweight", BodyMetrics.bmiCategory(18.0));
        assertEquals("Normal", BodyMetrics.bmiCategory(22.9));
        assertEquals("Overweight", BodyMetrics.bmiCategory(24.0));
        assertEquals("Obese", BodyMetrics.bmiCategory(26.0));
        assertNull(BodyMetrics.bmi(70.0, null));
    }

    @Test
    void navyBodyFatMatchesTheFormula() {
        assertEquals(20.1, BodyMetrics.navyBodyFat("male", 178.0, 90.0, 38.0, null));
        assertEquals(32.2, BodyMetrics.navyBodyFat("female", 162.0, 80.0, 34.0, 100.0));
        assertNull(BodyMetrics.navyBodyFat("female", 162.0, 80.0, 34.0, null), "women need a hip measurement");
        assertNull(BodyMetrics.navyBodyFat(null, 178.0, 90.0, 38.0, null), "the formula needs a sex");
        assertNull(BodyMetrics.navyBodyFat("male", 178.0, 38.0, 40.0, null), "neck wider than waist is a typo");
        assertEquals("Average", BodyMetrics.bodyFatCategory("male", 20.1));
        assertEquals("High", BodyMetrics.bodyFatCategory("female", 32.2));
        assertEquals(63.9, BodyMetrics.leanMass(80.0, 20.1));
        assertEquals(16.1, BodyMetrics.fatMass(80.0, 20.1));
    }

    @Test
    void waistRatios() {
        assertEquals(0.51, BodyMetrics.waistToHeight(90.0, 178.0));
        assertEquals("Increased risk", BodyMetrics.waistToHeightCategory(0.51));
        assertEquals("Healthy", BodyMetrics.waistToHeightCategory(0.45));
        assertEquals("Healthy", BodyMetrics.waistToHipCategory("male", 0.88));
        assertEquals("Increased risk", BodyMetrics.waistToHipCategory("female", 0.88));
    }

    @Test
    void energyUsesMifflinStJeor() {
        assertEquals(1728, BodyMetrics.bmr("male", 75.0, 178.0, 28));
        assertEquals(1562, BodyMetrics.bmr("female", 75.0, 178.0, 28));
        assertEquals(2678, BodyMetrics.tdee(1728, "moderately_active"));
        assertNull(BodyMetrics.bmr("male", 75.0, 178.0, null));
    }

    @Test
    void weeklyRateIsTheTrendNotTheLastWeighIn() {
        LocalDate d = LocalDate.of(2026, 1, 1);
        // Steady 0.5 kg/week loss with one heavy morning in the middle.
        List<BodyMetrics.WeighIn> logs = List.of(
                new BodyMetrics.WeighIn(d, 80.0),
                new BodyMetrics.WeighIn(d.plusDays(7), 79.5),
                new BodyMetrics.WeighIn(d.plusDays(10), 80.2),
                new BodyMetrics.WeighIn(d.plusDays(14), 79.0),
                new BodyMetrics.WeighIn(d.plusDays(21), 78.5));
        double rate = BodyMetrics.kgPerWeek(logs);
        assertTrue(rate < -0.4 && rate > -0.6, "rate was " + rate);
        assertNull(BodyMetrics.kgPerWeek(logs.subList(0, 1)));
        assertNull(BodyMetrics.kgPerWeek(List.of(new BodyMetrics.WeighIn(d, 80.0), new BodyMetrics.WeighIn(d.plusDays(3), 79.0))),
                "under a week of data says nothing");
    }

    @Test
    void paceIsJudgedAgainstTheGoal() {
        double[] bulk = BodyMetrics.targetPctPerWeek("gain_muscle");
        assertEquals("On track", BodyService.paceStatus(0.2, bulk));
        assertEquals("Too fast", BodyService.paceStatus(0.5, bulk));
        assertEquals("Too slow", BodyService.paceStatus(0.05, bulk));
        assertEquals("Losing", BodyService.paceStatus(-0.3, bulk));
        double[] cut = BodyMetrics.targetPctPerWeek("lose_weight");
        assertEquals("On track", BodyService.paceStatus(-0.7, cut));
        assertEquals("Too fast", BodyService.paceStatus(-1.4, cut));
        assertEquals("Too slow", BodyService.paceStatus(-0.2, cut));
        assertEquals("Gaining", BodyService.paceStatus(0.3, cut));
        assertEquals("On track", BodyService.paceStatus(0.05, BodyMetrics.targetPctPerWeek(null)));
        assertNull(BodyService.paceStatus(null, cut));
    }

    @Test
    void latestPerFieldSkipsGapsAndShowsTheChange() {
        LocalDate d = LocalDate.of(2026, 3, 1);
        List<BodyMeasurement> newestFirst = List.of(
                BodyMeasurement.builder().logDate(d.plusDays(14)).armCm(36.5).build(),
                BodyMeasurement.builder().logDate(d.plusDays(7)).waistCm(88.0).armCm(36.0).build(),
                BodyMeasurement.builder().logDate(d).waistCm(90.0).neckCm(38.0).build());
        Map<String, Object> tape = BodyService.latestPerField(newestFirst);
        assertEquals(Map.of("value", 88.0, "date", d.plusDays(7), "change", -2.0), tape.get("waistCm"));
        assertEquals(0.5, ((Map<?, ?>) tape.get("armCm")).get("change"));
        assertNull(((Map<?, ?>) tape.get("neckCm")).get("change"));
        assertFalse(tape.containsKey("hipCm"));
    }

    @Test
    void savingMeasurementsMergesTodaysRowAndFillsInBodyFat() {
        User u = userRepository.save(User.builder()
                .email("body@test.dev").name("Body").password("x")
                .evolutionStage("Spark").evolutionPoints(0).streak(0).profileComplete(true)
                .gender("male").age(28).heightCm(178.0).weightKg(80.0).activityLevel("moderately_active")
                .build());

        Map<String, Object> before = bodyService.body(u);
        assertNull(before.get("bodyFatPct"));
        assertEquals(List.of("waist", "neck"), before.get("bodyFatNeeds"));

        MeasurementRequest waist = new MeasurementRequest();
        waist.setWaistCm(90.04);
        bodyService.saveMeasurements(u, waist);
        MeasurementRequest neck = new MeasurementRequest();
        neck.setNeckCm(38.0);
        Map<String, Object> after = bodyService.saveMeasurements(u, neck);

        assertEquals(20.1, after.get("bodyFatPct"));
        assertEquals(List.of(), after.get("bodyFatNeeds"));
        assertEquals(0.51, after.get("waistToHeight"));
        assertEquals(1, bodyService.history(u).size(), "same day updates one row");
        assertEquals(90.0, bodyService.history(u).get(0).getWaistCm());

        assertThrows(ResponseStatusException.class, () -> bodyService.saveMeasurements(u, new MeasurementRequest()));
    }
}
