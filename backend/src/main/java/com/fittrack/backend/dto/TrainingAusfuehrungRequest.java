package com.fittrack.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TrainingAusfuehrungRequest {
    private Long trainingId;
    private String ort;
    private Integer dauerSekunden;
    private List<UebungSessionRequest> uebungSessions;
    /** Optional: nachtraeglich gewaehltes Datum (z.B. aus der Kalender-Ansicht) statt "jetzt". */
    private LocalDate datum;
}
