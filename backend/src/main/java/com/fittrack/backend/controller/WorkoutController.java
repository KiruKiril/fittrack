package com.fittrack.backend.controller;

import com.fittrack.backend.dto.WorkoutRequest;
import com.fittrack.backend.dto.WorkoutResponse;
import com.fittrack.backend.service.WorkoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "http://localhost:4200")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @GetMapping
    public ResponseEntity<List<WorkoutResponse>> getWorkouts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                workoutService.getWorkouts(userDetails.getUsername())
                        .stream()
                        .map(WorkoutResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @PostMapping
    public ResponseEntity<WorkoutResponse> createWorkout(
            @RequestBody WorkoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                WorkoutResponse.from(
                        workoutService.createWorkout(request, userDetails.getUsername())
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkout(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        workoutService.deleteWorkout(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}