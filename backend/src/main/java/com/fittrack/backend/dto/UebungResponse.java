package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungTyp;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UebungResponse {
    private Long id;
    private String name;
    private UebungTyp typ;
    private String beschreibung;
    private int empfWiederholungen;
    private LocalDateTime createdAt;
    /** true = Bibliotheks-Uebung, von der App bereitgestellt und nicht vom eingeloggten User erstellt. */
    private boolean bibliothek;

    public static UebungResponse from(Uebung uebung) {
        UebungResponse dto = new UebungResponse();
        dto.setId(uebung.getId());
        dto.setName(uebung.getName());
        dto.setTyp(uebung.getTyp());
        dto.setBeschreibung(uebung.getBeschreibung());
        dto.setEmpfWiederholungen(uebung.getEmpfWiederholungen());
        dto.setCreatedAt(uebung.getCreatedAt());
        dto.setBibliothek(uebung.getUser() == null);
        return dto;
    }
}