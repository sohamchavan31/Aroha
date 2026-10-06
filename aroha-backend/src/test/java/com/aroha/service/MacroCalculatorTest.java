package com.aroha.service;

import com.aroha.model.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MacroCalculatorTest {

    private static User base() {
        User u = new User();
        u.setGender("male");
        u.setAge(25);
        u.setWeightKg(70.0);
        u.setHeightCm(175.0);
        u.setActivityLevel("moderately_active");
        return u;
    }

    @Test
    void maintenanceMatchesMifflinStJeorTimesActivity() {
        User u = base();
        u.setHealthGoal("maintain");
        MacroCalculator.apply(u);
        // BMR = 700 + 1093.75 - 125 + 5 = 1673.75; × 1.55 = 2594
        assertEquals(2594, u.getDailyCalorieGoal());
        assertEquals(112, u.getDailyProteinGoal()); // 1.6 g/kg
        assertEquals(63, u.getDailyFatGoal());      // 0.9 g/kg
    }

    @Test
    void moderateCutIs400Below() {
        User u = base();
        u.setHealthGoal("lose_weight");
        u.setWeightChangeSpeed("moderate_cut");
        MacroCalculator.apply(u);
        assertEquals(2594 - 400, u.getDailyCalorieGoal());
        assertEquals(154, u.getDailyProteinGoal()); // 2.2 g/kg on a cut
    }

    @Test
    void neverBelow1200() {
        User u = base();
        u.setWeightKg(40.0);
        u.setHeightCm(140.0);
        u.setAge(80);
        u.setActivityLevel("sedentary");
        u.setHealthGoal("lose_weight");
        u.setWeightChangeSpeed("aggressive_cut");
        MacroCalculator.apply(u);
        assertEquals(1200, u.getDailyCalorieGoal());
    }

    @Test
    void newWeightChangesTargets() {
        User u = base();
        u.setHealthGoal("maintain");
        MacroCalculator.apply(u);
        int before = u.getDailyCalorieGoal();
        u.setWeightKg(80.0);
        MacroCalculator.apply(u);
        assertEquals(before + 155, u.getDailyCalorieGoal()); // +10 kg → BMR +100 → × 1.55
    }

    @Test
    void missingStatsLeaveTargetsUntouched() {
        User u = new User();
        MacroCalculator.apply(u);
        assertNull(u.getDailyCalorieGoal());
    }
}
