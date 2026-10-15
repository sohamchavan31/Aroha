package com.aroha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionResponse {
    private Long id;
    private String title;
    private String type;
    private String category;
    private int epReward;
    private boolean completed;
    // true when the app completes it automatically from your activity
    private boolean auto;
    // AUTO | TIMER | EVENING | MANUAL (see AutoMission)
    private String kind;
    // how it gets done, shown under the title
    private String hint;
    // TIMER: length of the timer, and when it was started (null if not yet)
    private int minutes;
    private java.time.LocalDateTime startedAt;
}
