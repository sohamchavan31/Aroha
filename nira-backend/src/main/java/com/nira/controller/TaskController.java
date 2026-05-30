package com.nira.controller;

import com.nira.dto.TaskRequest;
import com.nira.model.Task;
import com.nira.model.User;
import com.nira.service.TaskService;
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
        return ResponseEntity.ok(taskService.toggleTask(user, id));
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
