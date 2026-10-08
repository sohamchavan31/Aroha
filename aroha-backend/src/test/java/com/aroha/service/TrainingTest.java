package com.aroha.service;

import com.aroha.model.User;
import com.aroha.model.WorkoutLog;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TrainingTest {

    private static WorkoutLog set(int sets) {
        WorkoutLog l = new WorkoutLog();
        l.setSets(sets);
        return l;
    }

    private static User user(Double kg) {
        User u = new User();
        u.setWeightKg(kg);
        return u;
    }

    @Test
    void countsSetsIncludingOldMultiSetRows() {
        assertEquals(5, Training.sets(List.of(set(1), set(1), set(3))));
    }

    @Test
    void twentyFourSetsIsAboutAnHourAndFourHundredKcalAt80Kg() {
        assertEquals(60, Training.minutes(24));
        assertEquals(400, Math.round(Training.kcalForSets(24, user(80.0))));
    }

    @Test
    void sessionAndItsLoggedSetsAreNotCountedTwice() {
        // a 300 kcal session that also logged 12 sets (~200 kcal at 80 kg): 300, not 500
        assertEquals(300, Math.round(Training.burned(300, 12, user(80.0))));
        // hand-logged sets only
        assertEquals(400, Math.round(Training.burned(0, 24, user(80.0))));
    }

    @Test
    void missingWeightFallsBackTo70Kg() {
        assertEquals(350, Math.round(Training.kcalForSets(24, user(null))));
    }
}
