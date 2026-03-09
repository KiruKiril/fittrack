package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Exercise;
import lombok.Data;

@Data
public class ExerciseResponse {
    private Long id;
    private String name;
    private int sets;
    private int reps;
    private double weight;

    public static ExerciseResponse from(Exercise exercise) {
        ExerciseResponse dto = new ExerciseResponse();
        dto.setId(exercise.getId());
        dto.setName(exercise.getName());
        dto.setSets(exercise.getSets());
        dto.setReps(exercise.getReps());
        dto.setWeight(exercise.getWeight());
        return dto;
    }
}