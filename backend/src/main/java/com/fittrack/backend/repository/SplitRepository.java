package com.fittrack.backend.repository;

import com.fittrack.backend.entity.Split;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SplitRepository extends JpaRepository<Split, Long> {
    List<Split> findByUserId(Long userId);

    List<Split> findByUserIsNull();

    long countByUserIsNull();

    Optional<Split> findByUserIdAndBibliothekOriginId(Long userId, Long bibliothekOriginId);
}
