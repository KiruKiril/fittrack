package com.fittrack.backend.controller;

import com.fittrack.backend.dto.WorkoutRequest;
import com.fittrack.backend.entity.Workout;
import com.fittrack.backend.service.WorkoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "http://localhost:4200")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @GetMapping
    public ResponseEntity<List<Workout>> getWorkouts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workoutService.getWorkouts(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<Workout> createWorkout(
            @RequestBody WorkoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workoutService.createWorkout(request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkout(@PathVariable Long id) {
        workoutService.deleteWorkout(id);
        return ResponseEntity.noContent().build();
    }
}