package com.nira.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_hindi")
    private String nameHindi;

    @Column(nullable = false)
    private String category;

    private String region;

    @Column(name = "calories_per_100g")
    private double caloriesPer100g;

    @Column(name = "protein_per_100g")
    private double proteinPer100g;

    @Column(name = "carbs_per_100g")
    private double carbsPer100g;

    @Column(name = "fat_per_100g")
    private double fatPer100g;

    @Column(name = "fiber_per_100g")
    private double fiberPer100g;

    @Column(name = "serving_unit")
    private String servingUnit;

    @Column(name = "typical_serving")
    private double typicalServing;
}
