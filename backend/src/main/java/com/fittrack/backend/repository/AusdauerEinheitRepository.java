package com.fittrack.backend.repository;

import com.fittrack.backend.entity.AusdauerEinheit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AusdauerEinheitRepository extends JpaRepository<AusdauerEinheit, Long> {
    List<AusdauerEinheit> findByUebungSessionId(Long uebungSessionId);
}
