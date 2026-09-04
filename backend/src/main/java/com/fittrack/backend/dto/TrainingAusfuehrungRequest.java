package com.fittrack.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class TrainingAusfuehrungRequest {
    private Long trainingId;
    private String ort;
    private Integer dauerSekunden;
    private List<UebungSessionRequest> uebungSessions;
}
