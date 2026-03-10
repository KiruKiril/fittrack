package com.fittrack.backend.repository;

import com.fittrack.backend.entity.UebungSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UebungSessionRepository extends JpaRepository<UebungSession, Long> {
    List<UebungSession> findByTrainingAusfuehrungId(Long trainingAusfuehrungId);
}
