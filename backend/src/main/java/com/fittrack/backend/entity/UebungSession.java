package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "uebung_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UebungSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_ausfuehrung_id", nullable = false)
    private TrainingAusfuehrung trainingAusfuehrung;

    /** null, wenn die Uebung inzwischen geloescht wurde - Name/Typ bleiben in den Snapshot-Feldern erhalten. */
    @ManyToOne
    @JoinColumn(name = "uebung_id")
    private Uebung uebung;

    /** Snapshot des Uebungsnamens zum Zeitpunkt der Erfassung, ueberlebt eine spaetere Loeschung der Uebung. */
    private String uebungName;

    @Enumerated(EnumType.STRING)
    private UebungTyp uebungTyp;

    @OneToMany(mappedBy = "uebungSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Satz> saetze;

    @OneToMany(mappedBy = "uebungSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AusdauerEinheit> ausdauerEinheiten;

}
