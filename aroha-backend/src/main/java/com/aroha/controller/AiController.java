package com.aroha.controller;

import com.aroha.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/meal-plan")
    public ResponseEntity<Map<?, ?>> mealPlan(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(aiService.getMealPlan(body));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<?, ?>> chat(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(aiService.chat(body));
    }

    @PostMapping("/insights")
    public ResponseEntity<Map<?, ?>> insights(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(aiService.getInsights(body));
    }
}
