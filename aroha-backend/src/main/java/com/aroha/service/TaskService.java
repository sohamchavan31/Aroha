package com.aroha.service;

import com.aroha.dto.TaskRequest;
import com.aroha.model.Task;
import com.aroha.model.User;
import com.aroha.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public Task createTask(User user, TaskRequest request) {
        LocalDate date = request.getTaskDate() != null
                ? LocalDate.parse(request.getTaskDate())
                : LocalDate.now();

        Task task = Task.builder()
                .userId(user.getId())
                .title(request.getTitle())
                .taskDate(date)
                .scheduledTime(request.getScheduledTime())
                .completed(false)
                .carriedForward(false)
                .linkedHabitId(request.getLinkedHabitId())
                .build();

        return taskRepository.save(task);
    }

    public Map<String, Object> getTasksForDate(User user, LocalDate date) {
        List<Task> tasks = taskRepository
                .findByUserIdAndTaskDateOrderByScheduledTimeAscCreatedAtAsc(user.getId(), date);

        long done      = tasks.stream().filter(Task::isCompleted).count();
        long remaining = tasks.size() - done;

        Map<String, Object> response = new HashMap<>();
        response.put("tasks",     tasks);
        response.put("total",     tasks.size());
        response.put("done",      done);
        response.put("remaining", remaining);
        return response;
    }

    public Task toggleTask(User user, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        if (!task.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your task");
        }

        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    public void deleteTask(User user, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        if (!task.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your task");
        }

        taskRepository.delete(task);
    }

    // Carries all incomplete tasks from yesterday forward to today
    public int carryForward(User user) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Task> incomplete = taskRepository
                .findByUserIdAndTaskDateAndCompleted(user.getId(), yesterday, false);

        for (Task old : incomplete) {
            Task carried = Task.builder()
                    .userId(user.getId())
                    .title(old.getTitle())
                    .taskDate(LocalDate.now())
                    .scheduledTime(old.getScheduledTime())
                    .completed(false)
                    .carriedForward(true)
                    .linkedHabitId(old.getLinkedHabitId())
                    .build();
            taskRepository.save(carried);
        }

        return incomplete.size();
    }
}
