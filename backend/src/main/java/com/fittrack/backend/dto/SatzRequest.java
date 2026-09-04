package com.fittrack.backend.dto;

import lombok.Data;

@Data
public class SatzRequest {
    private int wiederholungen;
    private double gewicht;
    private boolean dropset;
}
