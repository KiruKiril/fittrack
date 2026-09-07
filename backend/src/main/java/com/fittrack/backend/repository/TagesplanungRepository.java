package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Tagesplanung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TagesplanungRepository extends JpaRepository<Tagesplanung, Long> {
    List<Tagesplanung> findByUserId(Long userId);

    Optional<Tagesplanung> findByUserIdAndDatum(Long userId, LocalDate datum);

    void deleteByUserIdAndDatum(Long userId, LocalDate datum);
}
