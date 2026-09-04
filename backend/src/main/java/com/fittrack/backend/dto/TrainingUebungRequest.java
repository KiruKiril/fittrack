package com.fittrack.backend.dto;

import lombok.Data;

@Data
public class TrainingUebungRequest {
    private Long uebungId;
    private int empfSaetze;
    private Double empfDistanzMeter;
    private Integer empfDauerSekunden;
}
