package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Split;
import com.fittrack.backend.entity.SplitTraining;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class SplitResponse {
    private Long id;
    private String name;
    private String beschreibung;
    /** true = Bibliotheks-Split, von der App bereitgestellt und nicht vom eingeloggten User erstellt. */
    private boolean bibliothek;
    private int aktuellerIndex;
    /** Das naechste anstehende Training in der Reihenfolge des Splits (null, wenn keine Trainings enthalten sind). */
    private SplitTrainingResponse naechstesTraining;
    private LocalDateTime createdAt;
    private List<SplitTrainingResponse> trainings;

    public static SplitResponse from(Split split) {
        SplitResponse dto = new SplitResponse();
        dto.setId(split.getId());
        dto.setName(split.getName());
        dto.setBeschreibung(split.getBeschreibung());
        dto.setBibliothek(split.getUser() == null);
        dto.setAktuellerIndex(split.getAktuellerIndex());
        dto.setCreatedAt(split.getCreatedAt());

        List<SplitTraining> sortiert = split.getTrainings() == null
                ? Collections.emptyList()
                : split.getTrainings().stream()
                        .sorted(Comparator.comparingInt(SplitTraining::getReihenfolge))
                        .collect(Collectors.toList());

        dto.setTrainings(sortiert.stream().map(SplitTrainingResponse::from).collect(Collectors.toList()));

        if (!sortiert.isEmpty()) {
            int index = Math.floorMod(split.getAktuellerIndex(), sortiert.size());
            dto.setNaechstesTraining(SplitTrainingResponse.from(sortiert.get(index)));
        }

        return dto;
    }
}
