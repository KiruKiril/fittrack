package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "split_trainings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SplitTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "split_id", nullable = false)
    private Split split;

    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    /** 1-basierte Position dieses Trainings innerhalb des Splits. */
    private int reihenfolge;

    /** Optional: fester Wochentag fuer dieses Training. Null = kein fester Wochenrhythmus. */
    @Enumerated(EnumType.STRING)
    private Wochentag wochentag;
}
