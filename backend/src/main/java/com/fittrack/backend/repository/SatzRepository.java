package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Satz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatzRepository extends JpaRepository<Satz, Long> {
    List<Satz> findByUebungSessionId(Long uebungSessionId);
}
