package com.fittrack.backend.repository;

import com.fittrack.backend.entity.TrainingUebung;
import com.fittrack.backend.entity.Uebung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingUebungRepository extends JpaRepository<TrainingUebung, Long> {
    List<TrainingUebung> findByTrainingId(Long trainingId);
}
