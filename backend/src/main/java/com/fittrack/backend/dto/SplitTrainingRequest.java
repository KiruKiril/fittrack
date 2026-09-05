package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Wochentag;
import lombok.Data;

@Data
public class SplitTrainingRequest {
    private Long trainingId;
    private int reihenfolge;
    /** Optional - null = kein fester Wochenrhythmus. */
    private Wochentag wochentag;
}
