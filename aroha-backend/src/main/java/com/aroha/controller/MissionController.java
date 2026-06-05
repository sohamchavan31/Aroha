package com.aroha.controller;

import com.aroha.dto.CompleteResponse;
import com.aroha.dto.MissionResponse;
import com.aroha.model.User;
import com.aroha.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;

    @GetMapping("/today")
    public ResponseEntity<List<MissionResponse>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(missionService.getTodayMissions(user.getEmail()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CompleteResponse> complete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(missionService.completeMission(id, user.getEmail()));
    }
}
