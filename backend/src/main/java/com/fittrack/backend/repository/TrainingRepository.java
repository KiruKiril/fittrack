package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {
    List<Training> findByUserId(Long userId);

    List<Training> findByUserIsNull();

    List<Training> findByIdIn(List<Long> ids);

    long countByUserIsNull();
}
