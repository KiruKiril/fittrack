package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trainings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Training {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String beschreibung;

    private Integer defaultPauseZwischenSaetzenSekunden = 90;

    private Integer defaultPauseZwischenUebungenSekunden = 120;

    /** null = Bibliotheks-Training (von der App bereitgestellt, fuer alle sichtbar). */
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    /** Id des Bibliotheks-Trainings, von dem dieses Training beim Uebernehmen kopiert wurde (falls zutreffend). */
    private Long bibliothekOriginId;

    @OneToMany(mappedBy = "training", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TrainingUebung> uebungen;

    /** Offen erweiterbare Kategorisierung (siehe Sportart-Entity), fuer die Bibliotheks-Filterung. */
    @ManyToMany
    @JoinTable(name = "training_sportarten",
            joinColumns = @JoinColumn(name = "training_id"),
            inverseJoinColumns = @JoinColumn(name = "sportart_id"))
    private List<Sportart> sportarten = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
