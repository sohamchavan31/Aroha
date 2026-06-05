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
}
