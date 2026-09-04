package com.fittrack.backend.dto;

import lombok.Data;

@Data
public class AusdauerEinheitRequest {
    private int dauerSekunden;
    private double distanzMeter;
    private Integer herzfrequenzDurchschnitt;
    private Integer herzfrequenzMax;
    private Integer hoehenmeter;
    private String notiz;
}
