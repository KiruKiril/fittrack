package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Sportart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SportartRepository extends JpaRepository<Sportart, Long> {
    Optional<Sportart> findByNameIgnoreCase(String name);
}
