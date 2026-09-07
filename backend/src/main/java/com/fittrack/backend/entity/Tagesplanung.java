package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Kalender-basierte Vorausplanung: legt fest, welches Training an einem bestimmten Tag ansteht.
 * Rein informativ/planerisch - ersetzt nicht die eigentliche Rotation eines Splits
 * (Split.aktuellerIndex), sondern ueberlagert deren automatischen Vorschlag pro Tag optional.
 * Es darf pro User und Tag nur einen Eintrag geben (siehe TagesplanungRepository).
 */
@Entity
@Table(name = "tagesplanungen", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "datum"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tagesplanung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate datum;

    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;
}
