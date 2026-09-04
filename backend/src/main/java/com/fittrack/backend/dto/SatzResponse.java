package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Satz;
import lombok.Data;

@Data
public class SatzResponse {
    private Long id;
    private int wiederholungen;
    private double gewicht;
    private boolean dropset;

    public static SatzResponse from(Satz satz) {
        SatzResponse dto = new SatzResponse();
        dto.setId(satz.getId());
        dto.setWiederholungen(satz.getWiederholungen());
        dto.setGewicht(satz.getGewicht());
        dto.setDropset(satz.isDropset());
        return dto;
    }
}
