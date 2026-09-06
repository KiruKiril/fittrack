package com.fittrack.backend.service;

import com.fittrack.backend.dto.SplitRequest;
import com.fittrack.backend.dto.SplitTrainingRequest;
import com.fittrack.backend.entity.Split;
import com.fittrack.backend.entity.SplitTraining;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.SplitRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Ein Split ist eine geordnete Abfolge mehrerer Trainings (siehe Split-Entity). Splits sind neu
 * eingefuehrt und nutzen von Anfang an das Kopier-Prinzip der Bibliothek (siehe UebungService/
 * TrainingService.ensureOwnCopy) - es gibt bewusst keinen Verlinkungs-Mechanismus wie die
 * aeltere UebungZuweisung/TrainingZuweisung fuer Splits.
 */
@Service
public class SplitService {

    private final SplitRepository splitRepository;
    private final TrainingService trainingService;
    private final SportartService sportartService;
    private final UserRepository userRepository;

    public SplitService(SplitRepository splitRepository, TrainingService trainingService,
                         SportartService sportartService, UserRepository userRepository) {
        this.splitRepository = splitRepository;
        this.trainingService = trainingService;
        this.sportartService = sportartService;
        this.userRepository = userRepository;
    }

    public List<Split> getAllSplits(String username) {
        User user = getUser(username);
        return splitRepository.findByUserId(user.getId());
    }

    /** Bibliotheks-Splits, die dieser User noch nicht als eigene Kopie hat. */
    public List<Split> getLibrarySplits(String username) {
        User user = getUser(username);
        List<Long> bereitsKopiert = splitRepository.findByUserId(user.getId()).stream()
                .map(Split::getBibliothekOriginId)
                .filter(originId -> originId != null)
                .collect(Collectors.toList());

        return splitRepository.findByUserIsNull().stream()
                .filter(s -> !bereitsKopiert.contains(s.getId()))
                .collect(Collectors.toList());
    }

    public Split getSplit(Long id, String username) {
        User user = getUser(username);
        return findOwnedSplit(id, user);
    }

    /**
     * Uebernimmt einen Bibliotheks-Split als eigene, frei bearbeitbare Kopie samt Kopien aller
     * darin enthaltenen Bibliotheks-Trainings (und deren Uebungen) - Aenderungen wirken sich
     * weder auf das Original noch auf andere User aus.
     */
    @Transactional
    public Split addSplitFromLibrary(Long splitId, String username) {
        User user = getUser(username);
        Split original = splitRepository.findById(splitId)
                .orElseThrow(() -> new RuntimeException("Split not found"));

        if (original.getUser() != null) {
            throw new RuntimeException("Dieser Split ist kein Bibliotheks-Split");
        }

        Split vorhandeneKopie = splitRepository.findByUserIdAndBibliothekOriginId(user.getId(), splitId)
                .orElse(null);
        if (vorhandeneKopie != null) {
            return vorhandeneKopie;
        }

        Split kopie = new Split();
        kopie.setName(original.getName());
        kopie.setBeschreibung(original.getBeschreibung());
        kopie.setAktuellerIndex(0);
        kopie.setUser(user);
        kopie.setBibliothekOriginId(splitId);
        kopie.setSportarten(new ArrayList<>(original.getSportarten()));

        List<SplitTraining> kopierteTrainings = new ArrayList<>();
        for (SplitTraining st : original.getTrainings()) {
            Training eigenesTraining = trainingService.ensureOwnCopy(st.getTraining(), user);

            SplitTraining neuerEintrag = new SplitTraining();
            neuerEintrag.setSplit(kopie);
            neuerEintrag.setTraining(eigenesTraining);
            neuerEintrag.setReihenfolge(st.getReihenfolge());
            neuerEintrag.setWochentag(st.getWochentag());
            kopierteTrainings.add(neuerEintrag);
        }
        kopie.setTrainings(kopierteTrainings);

        return splitRepository.save(kopie);
    }

    @Transactional
    public Split createSplit(SplitRequest request, String username) {
        User user = getUser(username);

        Split split = new Split();
        split.setName(request.getName());
        split.setBeschreibung(request.getBeschreibung());
        split.setAktuellerIndex(0);
        split.setUser(user);
        split.setTrainings(buildSplitTrainings(split, request.getTrainings(), username));
        split.setSportarten(sportartService.resolveOrCreate(request.getSportarten()));

        return splitRepository.save(split);
    }

    @Transactional
    public Split updateSplit(Long id, SplitRequest request, String username) {
        User user = getUser(username);
        Split split = findOwnedSplit(id, user);

        split.setName(request.getName());
        split.setBeschreibung(request.getBeschreibung());

        split.getTrainings().clear();
        split.getTrainings().addAll(buildSplitTrainings(split, request.getTrainings(), username));
        split.setSportarten(sportartService.resolveOrCreate(request.getSportarten()));

        int anzahl = split.getTrainings().size();
        if (anzahl > 0 && split.getAktuellerIndex() >= anzahl) {
            split.setAktuellerIndex(0);
        }

        return splitRepository.save(split);
    }

    /** Springt zum naechsten Training in der Reihenfolge des Splits (mit Wrap-Around am Ende). */
    @Transactional
    public Split advance(Long id, String username) {
        User user = getUser(username);
        Split split = findOwnedSplit(id, user);

        int anzahl = split.getTrainings().size();
        if (anzahl > 0) {
            split.setAktuellerIndex((split.getAktuellerIndex() + 1) % anzahl);
        }

        return splitRepository.save(split);
    }

    /**
     * Legt gezielt fest, welcher SplitTraining-Eintrag als Naechstes dran ist - im Unterschied zu
     * advance() (immer nur relativ +1) kann hier ein beliebiger Eintrag aus der Liste gewaehlt
     * werden, um z.B. ein Training vorzuziehen, zu wiederholen oder zu ueberspringen. Die
     * automatische Reihenfolge (aktuellerIndex) bleibt danach einfach an dieser Stelle stehen und
     * laeuft von dort aus normal weiter.
     */
    @Transactional
    public Split setNext(Long id, Long splitTrainingId, String username) {
        User user = getUser(username);
        Split split = findOwnedSplit(id, user);

        List<SplitTraining> sortiert = split.getTrainings().stream()
                .sorted((a, b) -> Integer.compare(a.getReihenfolge(), b.getReihenfolge()))
                .collect(Collectors.toList());

        int index = -1;
        for (int i = 0; i < sortiert.size(); i++) {
            if (sortiert.get(i).getId().equals(splitTrainingId)) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            throw new RuntimeException("Dieser Trainings-Eintrag gehoert nicht zu diesem Split");
        }

        split.setAktuellerIndex(index);
        return splitRepository.save(split);
    }

    /** Markiert diesen Split als den "aktiven" Split des Users (max. einer gleichzeitig). */
    @Transactional
    public Split activateSplit(Long id, String username) {
        User user = getUser(username);
        Split split = findOwnedSplit(id, user);

        user.setAktiverSplitId(split.getId());
        userRepository.save(user);

        return split;
    }

    /** Hebt die Markierung als aktiver Split auf (kein aktiver Split mehr). */
    @Transactional
    public void deactivateSplit(String username) {
        User user = getUser(username);
        user.setAktiverSplitId(null);
        userRepository.save(user);
    }

    /** Der aktuell als "aktiv" markierte Split des Users, falls vorhanden. */
    public Optional<Split> getActiveSplit(String username) {
        User user = getUser(username);
        if (user.getAktiverSplitId() == null) {
            return Optional.empty();
        }
        return splitRepository.findById(user.getAktiverSplitId())
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(user.getId()));
    }

    @Transactional
    public void deleteSplit(Long id, String username) {
        User user = getUser(username);
        Split split = findOwnedSplit(id, user);

        if (id.equals(user.getAktiverSplitId())) {
            user.setAktiverSplitId(null);
            userRepository.save(user);
        }

        splitRepository.delete(split);
    }

    private List<SplitTraining> buildSplitTrainings(Split split, List<SplitTrainingRequest> requests, String username) {
        List<SplitTraining> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }

        for (SplitTrainingRequest item : requests) {
            // getTraining() prueft bereits, dass der User Zugriff auf dieses Training hat
            // (eigenes oder per Zuweisung/Kopie hinzugefuegtes Bibliotheks-Training).
            Training training = trainingService.getTraining(item.getTrainingId(), username);

            SplitTraining splitTraining = new SplitTraining();
            splitTraining.setSplit(split);
            splitTraining.setTraining(training);
            splitTraining.setReihenfolge(item.getReihenfolge());
            splitTraining.setWochentag(item.getWochentag());
            result.add(splitTraining);
        }

        return result;
    }

    private Split findOwnedSplit(Long id, User user) {
        Split split = splitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Split not found"));

        if (split.getUser() == null || !split.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to access this split");
        }

        return split;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
