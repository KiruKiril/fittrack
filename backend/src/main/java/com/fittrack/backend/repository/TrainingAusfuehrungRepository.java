package com.fittrack.backend.repository;

import com.fittrack.backend.entity.TrainingAusfuehrung;
import com.fittrack.backend.entity.TrainingUebung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingAusfuehrungRepository extends JpaRepository<TrainingAusfuehrung, Long> {
    List<TrainingAusfuehrung> findByUserId(Long userId);
}
