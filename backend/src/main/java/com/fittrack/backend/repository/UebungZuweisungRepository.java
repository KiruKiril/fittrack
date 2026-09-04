package com.fittrack.backend.repository;

import com.fittrack.backend.entity.UebungZuweisung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UebungZuweisungRepository extends JpaRepository<UebungZuweisung, Long> {
    List<UebungZuweisung> findByUserId(Long userId);

    boolean existsByUserIdAndUebungId(Long userId, Long uebungId);

    Optional<UebungZuweisung> findByUserIdAndUebungId(Long userId, Long uebungId);

    void deleteByUserIdAndUebungId(Long userId, Long uebungId);
}
