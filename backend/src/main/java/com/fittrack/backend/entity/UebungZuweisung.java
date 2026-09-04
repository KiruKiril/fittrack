package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Merkt sich, welche Bibliotheks-Uebung ein User zu "seinen" Uebungen hinzugefuegt hat. */
@Entity
@Table(name = "uebung_zuweisungen", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "uebung_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UebungZuweisung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "uebung_id", nullable = false)
    private Uebung uebung;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
