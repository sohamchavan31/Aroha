package com.aroha.controller;

import com.aroha.dto.CustomMealRequest;
import com.aroha.model.Meal;
import com.aroha.model.User;
import com.aroha.repository.MealRepository;
import com.aroha.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MealControllerTest {

    @Autowired MealController controller;
    @Autowired MealRepository mealRepository;
    @Autowired UserRepository userRepository;

    private static Meal meal(String name, boolean custom) {
        return Meal.builder().name(name).category("dairy").isCustom(custom).build();
    }

    @Test
    void rankPutsYourFoodsThenTheFoodItselfBeforeDishesContainingIt() {
        List<Meal> ranked = MealController.rank(List.of(
                meal("Palak Paneer", false),
                meal("Paneer Butter Masala", false),
                meal("Paneer (Low-fat)", false),
                meal("Shahi Paneer", false),
                meal("Low Fat Paneer", true),
                meal("Paneer (Regular)", false)), "Paneer");
        assertEquals(List.of("Low Fat Paneer", "Paneer (Low-fat)", "Paneer (Regular)", "Paneer Butter Masala", "Palak Paneer", "Shahi Paneer"),
                ranked.stream().map(Meal::getName).toList());
    }

    @Test
    void yourFoodsMatchByBrandToo() {
        Meal mine = meal("Low Fat Paneer", true);
        mine.setBrand("Milky Mist");
        List<Meal> ranked = MealController.rank(List.of(meal("Milk (Toned)", false), mine), "milky");
        assertEquals("Low Fat Paneer", ranked.get(0).getName());
    }

    private User user(String email) {
        return userRepository.save(User.builder().email(email).password("x").name("T")
                .evolutionStage("Spark").profileComplete(true).build());
    }

    private CustomMealRequest req(String name, double protein) {
        CustomMealRequest r = new CustomMealRequest();
        r.setName(name);
        r.setBrand("Milky Mist");
        r.setCategory("packaged");
        r.setCaloriesPer100g(205);
        r.setProteinPer100g(protein);
        r.setServingUnit("grams");
        r.setTypicalServing(100);
        return r;
    }

    @Test
    void ownersCanListEditAndDeleteTheirFoodsButNoOneElseCan() {
        User owner = user("foods-owner@example.com");
        User other = user("foods-other@example.com");
        Meal saved = controller.createCustom(owner, req("Low Fat Paneer", 25)).getBody();
        assertNotNull(saved);

        assertEquals(1, controller.mine(owner).getBody().size());
        assertTrue(controller.mine(other).getBody().isEmpty());
        // other people's foods don't show up anywhere
        assertTrue(controller.search(other, "low fat").getBody().stream().noneMatch(m -> m.getId().equals(saved.getId())));
        assertTrue(controller.all().getBody().stream().noneMatch(Meal::isCustom));

        assertThrows(ResponseStatusException.class, () -> controller.updateCustom(other, saved.getId(), req("Hacked", 1)));
        assertThrows(ResponseStatusException.class, () -> controller.deleteCustom(other, saved.getId()));

        Meal edited = controller.updateCustom(owner, saved.getId(), req("Low Fat Paneer", 24.5)).getBody();
        assertEquals(24.5, edited.getProteinPer100g());
        assertTrue(edited.isCustom());
        assertEquals(owner.getId(), edited.getCreatedBy());

        controller.deleteCustom(owner, saved.getId());
        assertTrue(mealRepository.findById(saved.getId()).isEmpty());
    }

    @Test
    void referenceFoodsCannotBeEditedOrDeleted() {
        User owner = user("foods-ref@example.com");
        Meal ref = mealRepository.save(Meal.builder().name("Reference Dal").category("dal").build());
        assertThrows(ResponseStatusException.class, () -> controller.deleteCustom(owner, ref.getId()));
        assertTrue(mealRepository.findById(ref.getId()).isPresent());
    }
}
