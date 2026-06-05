package com.aroha.controller;

import com.aroha.dto.EvolutionLogResponse;
import com.aroha.model.EvolutionLog;
import com.aroha.model.User;
import com.aroha.repository.EvolutionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evolution")
@RequiredArgsConstructor
public class EvolutionController {

    private final EvolutionLogRepository evolutionLogRepository;

    @GetMapping("/history")
    public ResponseEntity<List<EvolutionLogResponse>> getHistory(@AuthenticationPrincipal User user) {
        List<EvolutionLog> logs = evolutionLogRepository.findByUserIdOrderByStagedUpAtDesc(user.getId());
        List<EvolutionLogResponse> response = logs.stream()
                .map(l -> EvolutionLogResponse.builder()
                        .id(l.getId())
                        .fromStage(l.getFromStage())
                        .toStage(l.getToStage())
                        .epAtStageUp(l.getEpAtStageUp())
                        .stagedUpAt(l.getStagedUpAt())
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }
}
