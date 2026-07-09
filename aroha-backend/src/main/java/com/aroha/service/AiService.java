package com.aroha.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AiService {

    @Value("${aroha.ai.url:http://localhost:5000}")
    private String aiUrl;

    @Value("${aroha.ai.internal-key:}")
    private String internalKey;

    private final RestClient http = RestClient.create();

    public Map<?, ?> getMealPlan(Map<String, Object> body) {
        return post("/ai/meal-plan", body);
    }

    public Map<?, ?> chat(Map<String, Object> body) {
        return post("/ai/chat", body);
    }

    public Map<?, ?> getInsights(Map<String, Object> body) {
        return post("/ai/insights", body);
    }

    private Map<?, ?> post(String path, Object body) {
        return http.post()
                .uri(aiUrl + path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Internal-Key", internalKey)
                .body(body)
                .retrieve()
                .body(Map.class);
    }
}
