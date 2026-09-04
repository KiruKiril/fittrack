package com.fittrack.backend.dto;

import com.fittrack.backend.entity.AusdauerEinheit;
import lombok.Data;

@Data
public class AusdauerEinheitResponse {
    private Long id;
    private int dauerSekunden;
    private double distanzMeter;
    private Integer herzfrequenzDurchschnitt;
    private Integer herzfrequenzMax;
    private Integer hoehenmeter;
    private String notiz;

    public static AusdauerEinheitResponse from(AusdauerEinheit ausdauerEinheit) {
        AusdauerEinheitResponse dto = new AusdauerEinheitResponse();
        dto.setId(ausdauerEinheit.getId());
        dto.setDauerSekunden(ausdauerEinheit.getDauerSekunden());
        dto.setDistanzMeter(ausdauerEinheit.getDistanzMeter());
        dto.setHerzfrequenzDurchschnitt(ausdauerEinheit.getHerzfrequenzDurchschnitt());
        dto.setHerzfrequenzMax(ausdauerEinheit.getHerzfrequenzMax());
        dto.setHoehenmeter(ausdauerEinheit.getHoehenmeter());
        dto.setNotiz(ausdauerEinheit.getNotiz());
        return dto;
    }
}
