package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Uebung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UebungRepository extends JpaRepository<Uebung, Long> {
    List<Uebung> findByUserId(Long userId);
}
