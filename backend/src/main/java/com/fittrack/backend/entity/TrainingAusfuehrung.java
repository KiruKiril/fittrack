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

    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    private String ort;

    @OneToMany(mappedBy = "trainingAusfuehrung", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UebungSession> uebungSessions;

}
