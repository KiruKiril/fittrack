package com.fittrack.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class SplitRequest {
    private String name;
    private String beschreibung;
    private List<SplitTrainingRequest> trainings;
}
