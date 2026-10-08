package com.aroha.service;

/** Keys for missions the app can verify from the user's own logs. */
public final class AutoMission {

    private AutoMission() {}

    public static final String WORKOUT_20        = "WORKOUT_20";        // 20+ min of training today (sessions, or sets logged in Train)
    public static final String SESSION_DONE      = "SESSION_DONE";      // a generated session, or 6+ sets logged in Train
    public static final String ALL_HABITS        = "ALL_HABITS";        // every habit ticked for today
    public static final String SLEEP_LOGGED      = "SLEEP_LOGGED";      // today's sleep log exists
    public static final String SLEEP_7H          = "SLEEP_7H";          // today's sleep log is 7 h or more
    public static final String WATER_GOAL        = "WATER_GOAL";        // glasses today >= goal
    public static final String MEALS_LOGGED      = "MEALS_LOGGED";      // breakfast, lunch and dinner all logged
    public static final String BREAKFAST_PROTEIN = "BREAKFAST_PROTEIN"; // 20 g+ protein logged at breakfast
}
