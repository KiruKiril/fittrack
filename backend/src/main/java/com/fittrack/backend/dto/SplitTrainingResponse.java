package com.fittrack.backend.dto;

import com.fittrack.backend.entity.SplitTraining;
import com.fittrack.backend.entity.Wochentag;
import lombok.Data;

@Data
public class SplitTrainingResponse {
    private Long id;
    private Long trainingId;
    private String trainingName;
    private int reihenfolge;
    private Wochentag wochentag;

    public static SplitTrainingResponse from(SplitTraining splitTraining) {
        SplitTrainingResponse dto = new SplitTrainingResponse();
        dto.setId(splitTraining.getId());
        dto.setTrainingId(splitTraining.getTraining().getId());
        dto.setTrainingName(splitTraining.getTraining().getName());
        dto.setReihenfolge(splitTraining.getReihenfolge());
        dto.setWochentag(splitTraining.getWochentag());
        return dto;
    }
}
