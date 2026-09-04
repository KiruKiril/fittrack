package com.fittrack.backend.dto;

import com.fittrack.backend.entity.UebungTyp;
import lombok.Data;

@Data
public class UebungRequest {
    private String name;
    private UebungTyp typ;
    private String beschreibung;
    private int empfWiederholungen;
}
