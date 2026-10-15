package com.aroha.controller;

import com.aroha.dto.MeasurementRequest;
import com.aroha.model.BodyMeasurement;
import com.aroha.model.User;
import com.aroha.service.BodyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/body")
@RequiredArgsConstructor
public class BodyController {

    private final BodyService bodyService;

    /** BMI, body fat, lean and fat mass, waist ratios, BMR/TDEE, pace, latest tape measurements. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> body(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bodyService.body(user));
    }

    @PostMapping("/measurements")
    public ResponseEntity<Map<String, Object>> measure(@AuthenticationPrincipal User user,
                                                       @Valid @RequestBody MeasurementRequest request) {
        return ResponseEntity.ok(bodyService.saveMeasurements(user, request));
    }

    @GetMapping("/measurements")
    public ResponseEntity<List<BodyMeasurement>> history(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bodyService.history(user));
    }
}
