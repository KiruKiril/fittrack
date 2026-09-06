package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "training_ausfuehrungen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingAusfuehrung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null, wenn der Trainingsplan inzwischen geloescht wurde - der Name bleibt im Snapshot-Feld erhalten. */
    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;

    /** Snapshot des Trainingsnamens zum Zeitpunkt der Erfassung, ueberlebt eine spaetere Loeschung des Trainings. */
    private String trainingName;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        // Bereits explizit gesetzt (z.B. nachtraeglicher Kalender-Eintrag mit gewaehltem Datum) -
        // nicht mit "jetzt" ueberschreiben.
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    private String ort;

    /** Gesamtdauer der Trainingseinheit (Start bis Ende) in Sekunden - vom Live-Modus gemessen. */
    private Integer dauerSekunden;

    @OneToMany(mappedBy = "trainingAusfuehrung", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UebungSession> uebungSessions;

}
