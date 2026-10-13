package com.aroha.service;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sanity checks on the reference foods in R__reference_data.sql (all values
 * per 100 g as eaten). They catch rows entered per piece or as raw
 * ingredients, which once logged a chapati as 28 kcal.
 */
class ReferenceFoodsTest {

    record Food(String name, double kcal, double protein, double carbs, double fat, String unit, double serving) {
        double servingKcal() { return kcal * serving / 100; }
    }

    private static final Pattern ROW = Pattern.compile(
            "^\\('([^']+)',\\s*'[^']+',\\s*'[^']+',\\s*([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+),\\s*[\\d.]+,\\s*'([^']+)',\\s*([\\d.]+)\\)",
            Pattern.MULTILINE);

    private static Map<String, Food> foods() throws IOException {
        try (InputStream in = ReferenceFoodsTest.class.getResourceAsStream("/db/migration/R__reference_data.sql")) {
            assertNotNull(in, "reference data on the classpath");
            Matcher m = ROW.matcher(new String(in.readAllBytes(), StandardCharsets.UTF_8));
            Map<String, Food> foods = new LinkedHashMap<>();
            while (m.find()) {
                foods.put(m.group(1), new Food(m.group(1), d(m.group(2)), d(m.group(3)), d(m.group(4)), d(m.group(5)), m.group(6), d(m.group(7))));
            }
            return foods;
        }
    }

    private static double d(String s) { return Double.parseDouble(s); }

    @Test
    void thereAreHundredsOfFoods() throws IOException {
        assertTrue(foods().size() > 250);
    }

    /** Calories should roughly equal 4·protein + 4·carbs + 9·fat (fibre and rounding make up the rest). */
    @Test
    void caloriesMatchMacros() throws IOException {
        for (Food f : foods().values()) {
            double atwater = 4 * f.protein() + 4 * f.carbs() + 9 * f.fat();
            double gap = Math.abs(f.kcal() - atwater);
            assertTrue(gap <= Math.max(20, f.kcal() * 0.15),
                    f.name() + ": " + f.kcal() + " kcal but macros add up to " + Math.round(atwater));
        }
    }

    @Test
    void macrosFitIn100Grams() throws IOException {
        for (Food f : foods().values()) {
            assertTrue(f.protein() + f.carbs() + f.fat() <= 101, f.name() + " has more than 100 g of macros per 100 g");
            assertTrue(f.kcal() <= 900, f.name());
        }
    }

    /** One serving of everyday staples lands where an Indian food table puts it. */
    @Test
    void staplesHaveRealisticServings() throws IOException {
        Map<String, Food> foods = foods();
        assertServing(foods, "Chapati", 80, 140);
        assertServing(foods, "Pulka", 70, 120);
        assertServing(foods, "Paratha", 150, 260);
        assertServing(foods, "Puri", 90, 160);
        assertServing(foods, "Jowar Bhakri", 110, 190);
        assertServing(foods, "Steamed Rice", 160, 230);
        assertServing(foods, "Idli", 40, 90);
        assertServing(foods, "Medu Vada", 90, 170);
        assertServing(foods, "Urad Dal", 150, 260);
        assertServing(foods, "Boiled Egg", 60, 90);
        assertServing(foods, "Banana", 80, 130);
    }

    private static void assertServing(Map<String, Food> foods, String name, double min, double max) {
        Food f = foods.get(name);
        assertNotNull(f, name + " missing");
        double kcal = f.servingKcal();
        assertTrue(kcal >= min && kcal <= max,
                name + ": one " + f.unit() + " (" + f.serving() + " g) = " + Math.round(kcal) + " kcal, expected " + min + "–" + max);
    }
}
