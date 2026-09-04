package com.fittrack.backend.repository;

import com.fittrack.backend.entity.TrainingZuweisung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingZuweisungRepository extends JpaRepository<TrainingZuweisung, Long> {
    List<TrainingZuweisung> findByUserId(Long userId);

    boolean existsByUserIdAndTrainingId(Long userId, Long trainingId);

    Optional<TrainingZuweisung> findByUserIdAndTrainingId(Long userId, Long trainingId);

    void deleteByUserIdAndTrainingId(Long userId, Long trainingId);
}
