package com.fittrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private int sets;
    private int reps;
    private double weight;

    @ManyToOne
    @JoinColumn(name = "workout_id", nullable = false)
    private Workout workout;
}