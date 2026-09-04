package com.fittrack.backend.service;

import com.fittrack.backend.dto.UebungRequest;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.TrainingUebung;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungTyp;
import com.fittrack.backend.entity.UebungZuweisung;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TrainingRepository;
import com.fittrack.backend.repository.TrainingZuweisungRepository;
import com.fittrack.backend.repository.UebungRepository;
import com.fittrack.backend.repository.UebungZuweisungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UebungService {

    private final UebungRepository uebungRepository;
    private final UebungZuweisungRepository uebungZuweisungRepository;
    private final TrainingRepository trainingRepository;
    private final TrainingZuweisungRepository trainingZuweisungRepository;
    private final UserRepository userRepository;

    public UebungService(UebungRepository uebungRepository,
                          UebungZuweisungRepository uebungZuweisungRepository,
                          TrainingRepository trainingRepository,
                          TrainingZuweisungRepository trainingZuweisungRepository,
                          UserRepository userRepository) {
        this.uebungRepository = uebungRepository;
        this.uebungZuweisungRepository = uebungZuweisungRepository;
        this.trainingRepository = trainingRepository;
        this.trainingZuweisungRepository = trainingZuweisungRepository;
        this.userRepository = userRepository;
    }

    public List<Uebung> getAllUebungen(String username) {
        User user = getUser(username);
        List<Uebung> result = new ArrayList<>(uebungRepository.findByUserId(user.getId()));
        result.addAll(getAssignedLibraryUebungen(user));
        return result;
    }

    /** Bibliotheks-Uebungen, die dieser User noch nicht zu seinen hinzugefuegt hat. */
    public List<Uebung> getLibraryUebungen(String username) {
        User user = getUser(username);
        List<Long> assignedIds = uebungZuweisungRepository.findByUserId(user.getId()).stream()
                .map(z -> z.getUebung().getId())
                .collect(Collectors.toList());

        return uebungRepository.findByUserIsNull().stream()
                .filter(u -> !assignedIds.contains(u.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public Uebung addUebungFromLibrary(Long uebungId, String username) {
        User user = getUser(username);
        Uebung uebung = uebungRepository.findById(uebungId)
                .orElseThrow(() -> new RuntimeException("Uebung not found"));

        if (uebung.getUser() != null) {
            throw new RuntimeException("Diese Uebung ist keine Bibliotheks-Uebung");
        }

        if (!uebungZuweisungRepository.existsByUserIdAndUebungId(user.getId(), uebungId)) {
            UebungZuweisung zuweisung = new UebungZuweisung();
            zuweisung.setUser(user);
            zuweisung.setUebung(uebung);
            uebungZuweisungRepository.save(zuweisung);
        }

        return uebung;
    }

    public Uebung createUebung(UebungRequest request, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Uebung uebung = new Uebung();
        uebung.setName(request.getName());
        uebung.setTyp(request.getTyp() == null ? UebungTyp.KRAFT : request.getTyp());
        uebung.setBeschreibung(request.getBeschreibung());
        uebung.setEmpfWiederholungen(request.getEmpfWiederholungen());
        uebung.setUser(user);

        return uebungRepository.save(uebung);
    }

    @Transactional
    public void deleteUebung(Long id, String username) {
        User user = getUser(username);

        Uebung uebung = uebungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Uebung not found"));

        List<String> blockierendeTrainings = trainingsUsingUebung(uebung.getId(), user);
        if (!blockierendeTrainings.isEmpty()) {
            throw new RuntimeException(
                    "'" + uebung.getName() + "' wird von " + String.join(", ", blockierendeTrainings)
                            + " verwendet und kann daher nicht entfernt werden");
        }

        if (uebung.getUser() == null) {
            if (!uebungZuweisungRepository.existsByUserIdAndUebungId(user.getId(), id)) {
                throw new RuntimeException("Diese Uebung ist nicht in deiner Liste");
            }
            uebungZuweisungRepository.deleteByUserIdAndUebungId(user.getId(), id);
            return;
        }

        if (!uebung.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this uebung");
        }

        uebungRepository.deleteById(id);
    }

    /** Namen aller (eigenen oder hinzugefuegten) Trainingsplaene des Users, die diese Uebung verwenden. */
    private List<String> trainingsUsingUebung(Long uebungId, User user) {
        return accessibleTrainings(user).stream()
                .filter(t -> t.getUebungen().stream().anyMatch(tu -> tu.getUebung().getId().equals(uebungId)))
                .map(Training::getName)
                .collect(Collectors.toList());
    }

    /** Fuer jede Uebung des Users die Namen der Trainingsplaene, die sie verwenden (leer = ungenutzt, loeschbar). */
    public Map<Long, List<String>> getTrainingNamesByUebungId(String username) {
        User user = getUser(username);
        Map<Long, List<String>> result = new HashMap<>();

        for (Training training : accessibleTrainings(user)) {
            for (TrainingUebung tu : training.getUebungen()) {
                result.computeIfAbsent(tu.getUebung().getId(), k -> new ArrayList<>()).add(training.getName());
            }
        }

        return result;
    }

    private List<Training> accessibleTrainings(User user) {
        List<Training> trainings = new ArrayList<>(trainingRepository.findByUserId(user.getId()));
        trainingZuweisungRepository.findByUserId(user.getId())
                .forEach(z -> trainings.add(z.getTraining()));
        return trainings;
    }

    private List<Uebung> getAssignedLibraryUebungen(User user) {
        return uebungZuweisungRepository.findByUserId(user.getId()).stream()
                .map(UebungZuweisung::getUebung)
                .collect(Collectors.toList());
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
