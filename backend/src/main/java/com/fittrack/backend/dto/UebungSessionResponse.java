package com.fittrack.backend.dto;

import com.fittrack.backend.entity.UebungSession;
import com.fittrack.backend.entity.UebungTyp;
import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class UebungSessionResponse {
    private Long id;
    private Long uebungId;
    private String uebungName;
    private UebungTyp uebungTyp;
    private List<SatzResponse> saetze;
    private List<AusdauerEinheitResponse> ausdauerEinheiten;

    public static UebungSessionResponse from(UebungSession uebungSession) {
        UebungSessionResponse dto = new UebungSessionResponse();
        dto.setId(uebungSession.getId());
        dto.setUebungId(uebungSession.getUebung() != null ? uebungSession.getUebung().getId() : null);
        dto.setUebungName(uebungSession.getUebungName());
        dto.setUebungTyp(uebungSession.getUebungTyp());
        dto.setSaetze(
                uebungSession.getSaetze() == null
                        ? Collections.emptyList()
                        : uebungSession.getSaetze().stream()
                                .map(SatzResponse::from)
                                .collect(Collectors.toList())
        );
        dto.setAusdauerEinheiten(
                uebungSession.getAusdauerEinheiten() == null
                        ? Collections.emptyList()
                        : uebungSession.getAusdauerEinheiten().stream()
                                .map(AusdauerEinheitResponse::from)
                                .collect(Collectors.toList())
        );
        return dto;
    }
}
