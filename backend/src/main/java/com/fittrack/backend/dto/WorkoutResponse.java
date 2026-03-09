package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Workout;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class WorkoutResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private List<ExerciseResponse> exercises;

    public static WorkoutResponse from(Workout workout) {
        WorkoutResponse dto = new WorkoutResponse();
        dto.setId(workout.getId());
        dto.setName(workout.getName());
        dto.setDescription(workout.getDescription());
        dto.setCreatedAt(workout.getCreatedAt());
        dto.setExercises(
                workout.getExercises() == null ? List.of() :
                        workout.getExercises().stream()
                                .map(ExerciseResponse::from)
                                .collect(Collectors.toList())
        );
        return dto;
    }
}