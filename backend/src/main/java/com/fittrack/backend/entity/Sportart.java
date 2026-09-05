package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sportart/Disziplin (z.B. "Bodybuilding", "Laufen", "Rennvelo") als offen erweiterbare Liste -
 * bewusst eine eigene Tabelle statt eines Enums, damit eine neue Sportart ohne Code-Aenderung
 * hinzugefuegt werden kann (siehe SportartService.resolveOrCreate).
 */
@Entity
@Table(name = "sportarten", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sportart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
