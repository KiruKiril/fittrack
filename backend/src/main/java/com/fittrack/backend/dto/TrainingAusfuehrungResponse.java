package com.fittrack.backend.dto;

import com.fittrack.backend.entity.TrainingAusfuehrung;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class TrainingAusfuehrungResponse {
    private Long id;
    private Long trainingId;
    private String trainingName;
    private String ort;
    private Integer dauerSekunden;
    private LocalDateTime createdAt;
    private List<UebungSessionResponse> uebungSessions;

    public static TrainingAusfuehrungResponse from(TrainingAusfuehrung trainingAusfuehrung) {
        TrainingAusfuehrungResponse dto = new TrainingAusfuehrungResponse();
        dto.setId(trainingAusfuehrung.getId());
        dto.setTrainingId(trainingAusfuehrung.getTraining().getId());
        dto.setTrainingName(trainingAusfuehrung.getTraining().getName());
        dto.setOrt(trainingAusfuehrung.getOrt());
        dto.setDauerSekunden(trainingAusfuehrung.getDauerSekunden());
        dto.setCreatedAt(trainingAusfuehrung.getCreatedAt());
        dto.setUebungSessions(
                trainingAusfuehrung.getUebungSessions() == null
                        ? Collections.emptyList()
                        : trainingAusfuehrung.getUebungSessions().stream()
                                .map(UebungSessionResponse::from)
                                .collect(Collectors.toList())
        );
        return dto;
    }
}
