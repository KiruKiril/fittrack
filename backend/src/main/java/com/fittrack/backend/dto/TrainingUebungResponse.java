package com.fittrack.backend.dto;

import com.fittrack.backend.entity.TrainingUebung;
import lombok.Data;

@Data
public class TrainingUebungResponse {
    private Long id;
    private Long uebungId;
    private String uebungName;
    private int empfSaetze;
    private Double empfDistanzMeter;
    private Integer empfDauerSekunden;
    private Integer pauseZwischenSaetzenSekunden;
    private Integer pauseNachUebungSekunden;

    public static TrainingUebungResponse from(TrainingUebung trainingUebung) {
        TrainingUebungResponse dto = new TrainingUebungResponse();
        dto.setId(trainingUebung.getId());
        dto.setUebungId(trainingUebung.getUebung().getId());
        dto.setUebungName(trainingUebung.getUebung().getName());
        dto.setEmpfSaetze(trainingUebung.getEmpfSaetze());
        dto.setEmpfDistanzMeter(trainingUebung.getEmpfDistanzMeter());
        dto.setEmpfDauerSekunden(trainingUebung.getEmpfDauerSekunden());
        dto.setPauseZwischenSaetzenSekunden(trainingUebung.getPauseZwischenSaetzenSekunden());
        dto.setPauseNachUebungSekunden(trainingUebung.getPauseNachUebungSekunden());
        return dto;
    }
}
