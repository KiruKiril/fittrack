package com.fittrack.backend.service;

import com.fittrack.backend.entity.Sportart;
import com.fittrack.backend.repository.SportartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Sportarten sind eine offen erweiterbare Liste (siehe Sportart-Entity): eine neue Sportart
 * hinzuzufuegen bedeutet einfach, sie hier per Namen zu referenzieren - es entsteht automatisch
 * eine neue Zeile, ganz ohne Code- oder Schema-Aenderung.
 */
@Service
public class SportartService {

    private final SportartRepository sportartRepository;

    public SportartService(SportartRepository sportartRepository) {
        this.sportartRepository = sportartRepository;
    }

    @Transactional
    public List<Sportart> resolveOrCreate(List<String> namen) {
        List<Sportart> result = new ArrayList<>();
        if (namen == null) {
            return result;
        }

        for (String roh : namen) {
            String name = roh == null ? "" : roh.trim();
            if (name.isEmpty()) {
                continue;
            }
            Sportart sportart = sportartRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> {
                        Sportart neu = new Sportart();
                        neu.setName(name);
                        return sportartRepository.save(neu);
                    });
            if (!result.contains(sportart)) {
                result.add(sportart);
            }
        }

        return result;
    }
}
