package com.fittrack.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class WorkoutRequest {
    private String name;
    private String description;
    private List<ExerciseRequest> exercises;
}