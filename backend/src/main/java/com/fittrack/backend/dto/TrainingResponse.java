package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Sportart;
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
    private int defaultPauseZwischenSaetzenSekunden;
    private int defaultPauseZwischenUebungenSekunden;
    private LocalDateTime createdAt;
    private List<TrainingUebungResponse> uebungen;
    /** true = Bibliotheks-Training, von der App bereitgestellt und nicht vom eingeloggten User erstellt. */
    private boolean bibliothek;
    /** Namen der zugeordneten Sportarten (offen erweiterbare Liste), fuer die Bibliotheks-Filterung. */
    private List<String> sportarten;

    public static TrainingResponse from(Training training) {
        TrainingResponse dto = new TrainingResponse();
        dto.setId(training.getId());
        dto.setName(training.getName());
        dto.setBeschreibung(training.getBeschreibung());
        dto.setDefaultPauseZwischenSaetzenSekunden(
                training.getDefaultPauseZwischenSaetzenSekunden() != null ? training.getDefaultPauseZwischenSaetzenSekunden() : 90);
        dto.setDefaultPauseZwischenUebungenSekunden(
                training.getDefaultPauseZwischenUebungenSekunden() != null ? training.getDefaultPauseZwischenUebungenSekunden() : 120);
        dto.setCreatedAt(training.getCreatedAt());
        dto.setBibliothek(training.getUser() == null);
        dto.setSportarten(
                training.getSportarten() == null
                        ? Collections.emptyList()
                        : training.getSportarten().stream().map(Sportart::getName).collect(Collectors.toList())
        );
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
