package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Tagesplanung;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class TagesplanungResponse {
    private LocalDate datum;
    private Long trainingId;
    private String trainingName;

    public static TagesplanungResponse from(Tagesplanung planung) {
        return new TagesplanungResponse(
                planung.getDatum(),
                planung.getTraining().getId(),
                planung.getTraining().getName()
        );
    }
}
