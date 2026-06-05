package com.aroha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteResponse {
    private Long missionId;
    private int epEarned;
    private int totalEP;
    private String evolutionStage;
    private boolean stagedUp;
    private String newStage;
    private int strengthAttr;
    private int disciplineAttr;
    private int recoveryAttr;
    private int nutritionAttr;
}
