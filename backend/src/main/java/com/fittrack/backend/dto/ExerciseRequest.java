package com.fittrack.backend.dto;

import lombok.Data;

@Data
public class ExerciseRequest {
    private String name;
    private int sets;
    private int reps;
    private double weight;
}