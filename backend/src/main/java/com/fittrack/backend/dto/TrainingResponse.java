package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Training;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class TrainingResponse {
    private Long id;
    private String name;
    private String beschreibung;
    private LocalDateTime createdAt;
    private List<TrainingUebungResponse> uebungen;

    public static TrainingResponse from(Training training) {
        TrainingResponse dto = new TrainingResponse();
        dto.setId(training.getId());
        dto.setName(training.getName());
        dto.setBeschreibung(training.getBeschreibung());
        dto.setCreatedAt(training.getCreatedAt());
        dto.setUebungen(
                training.getUebungen() == null
                        ? Collections.emptyList()
                        : training.getUebungen().stream()
                                .map(TrainingUebungResponse::from)
                                .collect(Collectors.toList())
        );
        return dto;
    }
}
