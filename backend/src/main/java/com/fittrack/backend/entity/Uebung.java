package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name ="uebungen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Uebung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UebungTyp typ;

    private String beschreibung;
    private int empfWiederholungen ;

    /** null = Bibliotheks-Uebung (von der App bereitgestellt, fuer alle sichtbar). */
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    /** Id der Bibliotheks-Uebung, von der diese Uebung beim Uebernehmen kopiert wurde (falls zutreffend). */
    private Long bibliothekOriginId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
