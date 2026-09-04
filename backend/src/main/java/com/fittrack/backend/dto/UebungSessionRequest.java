package com.fittrack.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class UebungSessionRequest {
    private Long uebungId;
    private List<SatzRequest> saetze;
    private List<AusdauerEinheitRequest> ausdauerEinheiten;
}
