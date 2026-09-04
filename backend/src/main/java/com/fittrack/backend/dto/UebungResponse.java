package com.fittrack.backend.dto;

import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungTyp;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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
    /** Namen der Trainingsplaene, die diese Uebung verwenden - leer = die Uebung kann entfernt werden. */
    private List<String> verwendetInTrainings = Collections.emptyList();

    public static UebungResponse from(Uebung uebung) {
        return from(uebung, Collections.emptyList());
    }

    public static UebungResponse from(Uebung uebung, List<String> verwendetInTrainings) {
        UebungResponse dto = new UebungResponse();
        dto.setId(uebung.getId());
        dto.setName(uebung.getName());
        dto.setTyp(uebung.getTyp());
        dto.setBeschreibung(uebung.getBeschreibung());
        dto.setEmpfWiederholungen(uebung.getEmpfWiederholungen());
        dto.setCreatedAt(uebung.getCreatedAt());
        dto.setBibliothek(uebung.getUser() == null);
        dto.setVerwendetInTrainings(verwendetInTrainings);
        return dto;
    }
}