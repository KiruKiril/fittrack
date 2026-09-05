package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Uebung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UebungRepository extends JpaRepository<Uebung, Long> {
    List<Uebung> findByUserId(Long userId);

    List<Uebung> findByUserIsNull();

    List<Uebung> findByIdIn(List<Long> ids);

    long countByUserIsNull();

    Optional<Uebung> findByUserIdAndBibliothekOriginId(Long userId, Long bibliothekOriginId);
}
