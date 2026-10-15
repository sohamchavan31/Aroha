package com.aroha.service;

/**
 * How each daily mission is verified. Every mission is one of:
 * <ul>
 *   <li>AUTO: completes itself when the user's own logs show it's done;</li>
 *   <li>TIMER: done through an in-app timer, and the server checks the minutes passed;</li>
 *   <li>EVENING: ticked by hand, but only after 8 PM (a whole-day promise);</li>
 *   <li>MANUAL: older missions with no key, ticked by hand.</li>
 * </ul>
 * Anything the app can't check (screen time, steps) isn't offered.
 */
public final class AutoMission {

    private AutoMission() {}

    // AUTO
    public static final String WORKOUT_20         = "WORKOUT_20";         // 20+ min of training today (sessions, or sets logged in Train)
    public static final String SESSION_DONE       = "SESSION_DONE";       // a generated session, or 6+ sets logged in Train
    public static final String PUSHUPS_3          = "PUSHUPS_3";          // 3+ sets of push-ups logged in Train
    public static final String ALL_HABITS         = "ALL_HABITS";         // every habit ticked for today
    public static final String CHECKIN_EARLY      = "CHECKIN_EARLY";      // opened the app before 8 AM
    public static final String PLAN_TOMORROW      = "PLAN_TOMORROW";      // 3+ tasks planned for tomorrow
    public static final String SLEEP_LOGGED       = "SLEEP_LOGGED";       // today's sleep log exists
    public static final String SLEEP_7H           = "SLEEP_7H";           // today's sleep log is 7 h or more
    public static final String WATER_GOAL         = "WATER_GOAL";         // glasses today >= goal
    public static final String WEIGHED_IN         = "WEIGHED_IN";         // a weigh-in today
    public static final String MEALS_LOGGED       = "MEALS_LOGGED";       // breakfast, lunch and dinner all logged
    public static final String BREAKFAST_PROTEIN  = "BREAKFAST_PROTEIN";  // 20 g+ protein logged at breakfast
    public static final String FRUIT_VEG          = "FRUIT_VEG";          // a fruit or a sabzi logged today
    public static final String CALORIES_ON_TARGET = "CALORIES_ON_TARGET"; // after 8 PM: 80–105% of the calorie goal

    // TIMER
    public static final String TIMER_5  = "TIMER_5";
    public static final String TIMER_10 = "TIMER_10";

    // EVENING
    public static final String EVENING = "EVENING";

    public static final int EVENING_HOUR = 20;
    public static final int EARLY_HOUR = 8;

    public enum Kind { AUTO, TIMER, EVENING, MANUAL }

    public static Kind kind(String key) {
        if (key == null) return Kind.MANUAL;
        if (key.startsWith("TIMER_")) return Kind.TIMER;
        if (EVENING.equals(key)) return Kind.EVENING;
        return Kind.AUTO;
    }

    public static int timerMinutes(String key) {
        return kind(key) == Kind.TIMER ? Integer.parseInt(key.substring("TIMER_".length())) : 0;
    }

    /** One line under the mission telling the user how it gets done. */
    public static String hint(String key) {
        if (key == null) return null;
        return switch (key) {
            case WORKOUT_20         -> "Ticks itself after 20 min of training";
            case SESSION_DONE       -> "Ticks itself when you finish a session";
            case PUSHUPS_3          -> "Log 3 sets of push-ups in Train";
            case ALL_HABITS         -> "Ticks itself when every habit is done";
            case CHECKIN_EARLY      -> "Open Aroha before 8 AM";
            case PLAN_TOMORROW      -> "Add 3 tasks for tomorrow in Planner";
            case SLEEP_LOGGED       -> "Ticks itself when you log sleep";
            case SLEEP_7H           -> "Log 7 h or more of sleep";
            case WATER_GOAL         -> "Ticks itself at your water goal";
            case WEIGHED_IN         -> "Ticks itself when you log your weight";
            case MEALS_LOGGED       -> "Log breakfast, lunch and dinner";
            case BREAKFAST_PROTEIN  -> "20 g+ protein logged at breakfast";
            case FRUIT_VEG          -> "Ticks itself when you log fruit or a sabzi";
            case CALORIES_ON_TARGET -> "Checked after 8 PM: 80–105% of your goal";
            case EVENING            -> "Tick it after 8 PM";
            default -> kind(key) == Kind.TIMER ? "Tap to start a " + timerMinutes(key) + "-minute timer" : null;
        };
    }
}
