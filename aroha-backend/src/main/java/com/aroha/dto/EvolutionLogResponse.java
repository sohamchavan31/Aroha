package com.aroha.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EvolutionLogResponse {
    private Long id;
    private String fromStage;
    private String toStage;
    private int epAtStageUp;
    private LocalDateTime stagedUpAt;
}
