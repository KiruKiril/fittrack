package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Ein Split ist eine geordnete Abfolge mehrerer Trainings (z.B. "Push/Pull/Legs"), optional mit
 * fest zugeordneten Wochentagen. Ohne Wochentage laeuft der Split einfach der Reihe nach durch
 * und beginnt danach wieder von vorne ("Training 1 -> 2 -> 3 -> wiederholen").
 */
@Entity
@Table(name = "splits")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Split {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String beschreibung;

    /** Index (0-basiert) des naechsten anstehenden Trainings in der Reihenfolge des Splits. */
    private int aktuellerIndex = 0;

    /** null = Bibliotheks-Split (von der App bereitgestellt, fuer alle sichtbar). */
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    /** Id des Bibliotheks-Splits, von dem dieser Split beim Uebernehmen kopiert wurde (falls zutreffend). */
    private Long bibliothekOriginId;

    @OneToMany(mappedBy = "split", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SplitTraining> trainings;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
