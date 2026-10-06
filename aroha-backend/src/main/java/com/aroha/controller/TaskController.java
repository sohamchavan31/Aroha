package com.aroha.controller;

import com.aroha.service.ActivityService;
import com.aroha.dto.TaskRequest;
import com.aroha.model.Task;
import com.aroha.model.User;
import com.aroha.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<Task> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(user, request));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTasks(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(taskService.getTasksForDate(user, targetDate));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Task> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Task task = taskService.toggleTask(user, id);
        if (task.isCompleted()) activityService.recordActivity(user);
        return ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        taskService.deleteTask(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/carry-forward")
    public ResponseEntity<Map<String, Integer>> carryForward(@AuthenticationPrincipal User user) {
        int count = taskService.carryForward(user);
        return ResponseEntity.ok(Map.of("carried", count));
    }
}
