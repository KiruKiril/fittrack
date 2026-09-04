package com.fittrack.backend.service;

import com.fittrack.backend.dto.UebungRequest;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungTyp;
import com.fittrack.backend.entity.UebungZuweisung;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TrainingRepository;
import com.fittrack.backend.repository.TrainingUebungRepository;
import com.fittrack.backend.repository.TrainingZuweisungRepository;
import com.fittrack.backend.repository.UebungRepository;
import com.fittrack.backend.repository.UebungZuweisungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UebungService {

    private final UebungRepository uebungRepository;
    private final UebungZuweisungRepository uebungZuweisungRepository;
    private final TrainingRepository trainingRepository;
    private final TrainingZuweisungRepository trainingZuweisungRepository;
    private final TrainingUebungRepository trainingUebungRepository;
    private final UserRepository userRepository;

    public UebungService(UebungRepository uebungRepository,
                          UebungZuweisungRepository uebungZuweisungRepository,
                          TrainingRepository trainingRepository,
                          TrainingZuweisungRepository trainingZuweisungRepository,
                          TrainingUebungRepository trainingUebungRepository,
                          UserRepository userRepository) {
        this.uebungRepository = uebungRepository;
        this.uebungZuweisungRepository = uebungZuweisungRepository;
        this.trainingRepository = trainingRepository;
        this.trainingZuweisungRepository = trainingZuweisungRepository;
        this.trainingUebungRepository = trainingUebungRepository;
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

        if (isUsedByAnyTrainingOfUser(uebung.getId(), user)) {
            throw new RuntimeException(
                    "'" + uebung.getName() + "' wird von einem deiner Trainingspläne verwendet und kann daher nicht entfernt werden");
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

    private boolean isUsedByAnyTrainingOfUser(Long uebungId, User user) {
        List<Long> trainingIds = trainingRepository.findByUserId(user.getId()).stream()
                .map(Training::getId)
                .collect(Collectors.toList());
        trainingZuweisungRepository.findByUserId(user.getId())
                .forEach(z -> trainingIds.add(z.getTraining().getId()));

        if (trainingIds.isEmpty()) {
            return false;
        }
        return trainingUebungRepository.existsByUebungIdAndTrainingIdIn(uebungId, trainingIds);
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
