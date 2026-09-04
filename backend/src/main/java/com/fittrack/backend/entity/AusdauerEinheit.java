package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ausdauer_einheiten")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AusdauerEinheit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "uebung_session_id", nullable = false)
    private UebungSession uebungSession;

    @Column(nullable = false)
    private int dauerSekunden;

    @Column(nullable = false)
    private double distanzMeter;

    private Integer herzfrequenzDurchschnitt;

    private Integer herzfrequenzMax;

    private Integer hoehenmeter;

    private String notiz;
}
