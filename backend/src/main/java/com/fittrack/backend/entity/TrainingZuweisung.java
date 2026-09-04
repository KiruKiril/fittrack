package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Merkt sich, welchen Bibliotheks-Trainingsplan ein User zu "seinen" Trainings hinzugefuegt hat. */
@Entity
@Table(name = "training_zuweisungen", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "training_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingZuweisung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
