package com.fittrack.backend.dto;

import lombok.Data;

@Data
public class UebungRequest {
    private String name;
    private String beschreibung;
    private int empfWiederholungen;
}
