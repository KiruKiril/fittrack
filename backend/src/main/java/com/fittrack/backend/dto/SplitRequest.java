package com.fittrack.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class SplitRequest {
    private String name;
    private String beschreibung;
    private List<SplitTrainingRequest> trainings;
    /** Namen der Sportarten (offen erweiterbar - unbekannte Namen werden neu angelegt). */
    private List<String> sportarten;
}
