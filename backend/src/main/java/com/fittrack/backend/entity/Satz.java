package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "satz")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Satz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "uebung_session_id", nullable = false)
    private UebungSession uebungSession;

    private int wiederholungen;

    private double gewicht;

    private boolean dropset;
}
