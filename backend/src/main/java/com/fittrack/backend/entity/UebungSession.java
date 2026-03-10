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

    @ManyToOne
    @JoinColumn(name = "uebung_id", nullable = false)
    private Uebung uebung;

    @OneToMany(mappedBy = "uebungSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Satz> saetze;

}
