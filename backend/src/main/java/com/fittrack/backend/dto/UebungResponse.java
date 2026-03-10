package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Uebung;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UebungResponse {
    private Long id;
    private String name;
    private String beschreibung;
    private int empfWiederholungen;
    private LocalDateTime createdAt;

    public static UebungResponse from(Uebung uebung) {
        UebungResponse dto = new UebungResponse();
        dto.setId(uebung.getId());
        dto.setName(uebung.getName());
        dto.setBeschreibung(uebung.getBeschreibung());
        dto.setEmpfWiederholungen(uebung.getEmpfWiederholungen());
        dto.setCreatedAt(uebung.getCreatedAt());
        return dto;
    }
}