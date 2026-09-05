package com.fittrack.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class TrainingRequest {
    private String name;
    private String beschreibung;
    private Integer defaultPauseZwischenSaetzenSekunden;
    private Integer defaultPauseZwischenUebungenSekunden;
    private List<TrainingUebungRequest> uebungen;
    /** Namen der Sportarten (offen erweiterbar - unbekannte Namen werden neu angelegt). */
    private List<String> sportarten;
}
