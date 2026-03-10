package com.fittrack.backend.service;

import com.fittrack.backend.dto.UebungRequest;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.Workout;
import com.fittrack.backend.repository.UebungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UebungService {

    private final UebungRepository uebungRepository;
    private final UserRepository userRepository;

    public UebungService(UebungRepository uebungRepository, UserRepository userRepository) {
        this.uebungRepository = uebungRepository;
        this.userRepository = userRepository;
    }

    public List<Uebung> getAllUebungen(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return uebungRepository.findByUserId(user.getId());
    }

    public Uebung createUebung(UebungRequest request, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Uebung uebung = new Uebung();
        uebung.setName(request.getName());
        uebung.setBeschreibung(request.getBeschreibung());
        uebung.setEmpfWiederholungen(request.getEmpfWiederholungen());
        uebung.setUser(user);

        return uebungRepository.save(uebung);
    }

    public void deleteUebung(Long id, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Uebung uebung = uebungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Uebung not found"));

        if (!uebung.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this uebung");
        }

        uebungRepository.deleteById(id);
    }
}
