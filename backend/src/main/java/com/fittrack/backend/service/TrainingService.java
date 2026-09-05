package com.fittrack.backend.service;

import com.fittrack.backend.dto.TrainingRequest;
import com.fittrack.backend.dto.TrainingUebungRequest;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.TrainingAusfuehrung;
import com.fittrack.backend.entity.TrainingUebung;
import com.fittrack.backend.entity.TrainingZuweisung;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TrainingAusfuehrungRepository;
import com.fittrack.backend.repository.TrainingRepository;
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
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TrainingZuweisungRepository trainingZuweisungRepository;
    private final TrainingAusfuehrungRepository trainingAusfuehrungRepository;
    private final UebungRepository uebungRepository;
    private final UebungZuweisungRepository uebungZuweisungRepository;
    private final UebungService uebungService;
    private final UserRepository userRepository;

    public TrainingService(TrainingRepository trainingRepository,
                            TrainingZuweisungRepository trainingZuweisungRepository,
                            TrainingAusfuehrungRepository trainingAusfuehrungRepository,
                            UebungRepository uebungRepository,
                            UebungZuweisungRepository uebungZuweisungRepository,
                            UebungService uebungService,
                            UserRepository userRepository) {
        this.trainingRepository = trainingRepository;
        this.trainingZuweisungRepository = trainingZuweisungRepository;
        this.trainingAusfuehrungRepository = trainingAusfuehrungRepository;
        this.uebungRepository = uebungRepository;
        this.uebungZuweisungRepository = uebungZuweisungRepository;
        this.uebungService = uebungService;
        this.userRepository = userRepository;
    }

    public List<Training> getAllTrainings(String username) {
        User user = getUser(username);
        List<Training> result = new ArrayList<>(trainingRepository.findByUserId(user.getId()));
        result.addAll(getAssignedLibraryTrainings(user));
        return result;
    }

    /** Bibliotheks-Trainings, die dieser User weder (alt) verknuepft noch (neu) als eigene Kopie hat. */
    public List<Training> getLibraryTrainings(String username) {
        User user = getUser(username);
        List<Long> ausgeschlossen = new ArrayList<>(trainingZuweisungRepository.findByUserId(user.getId()).stream()
                .map(z -> z.getTraining().getId())
                .collect(Collectors.toList()));
        trainingRepository.findByUserId(user.getId()).stream()
                .map(Training::getBibliothekOriginId)
                .filter(originId -> originId != null)
                .forEach(ausgeschlossen::add);

        return trainingRepository.findByUserIsNull().stream()
                .filter(t -> !ausgeschlossen.contains(t.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Uebernimmt ein Bibliotheks-Training als eigene, frei bearbeitbare Kopie samt Kopien aller
     * darin verwendeten Bibliotheks-Uebungen (statt nur zu verlinken) - Aenderungen wirken sich
     * weder auf das Original noch auf andere User aus, die dieselbe Vorlage uebernommen haben.
     * Bereits bestehende (alte) Verlinkungen ueber TrainingZuweisung/UebungZuweisung bleiben
     * unangetastet und funktionieren weiterhin wie bisher.
     */
    @Transactional
    public Training addTrainingFromLibrary(Long trainingId, String username) {
        User user = getUser(username);
        Training original = trainingRepository.findById(trainingId)
                .orElseThrow(() -> new RuntimeException("Training not found"));

        if (original.getUser() != null) {
            throw new RuntimeException("Dieses Training ist kein Bibliotheks-Training");
        }

        Training vorhandeneKopie = trainingRepository.findByUserIdAndBibliothekOriginId(user.getId(), trainingId)
                .orElse(null);
        if (vorhandeneKopie != null) {
            return vorhandeneKopie;
        }

        Training kopie = new Training();
        kopie.setName(original.getName());
        kopie.setBeschreibung(original.getBeschreibung());
        kopie.setDefaultPauseZwischenSaetzenSekunden(original.getDefaultPauseZwischenSaetzenSekunden());
        kopie.setDefaultPauseZwischenUebungenSekunden(original.getDefaultPauseZwischenUebungenSekunden());
        kopie.setUser(user);
        kopie.setBibliothekOriginId(trainingId);

        List<TrainingUebung> kopierteUebungen = new ArrayList<>();
        for (TrainingUebung tu : original.getUebungen()) {
            Uebung eigeneUebung = uebungService.ensureOwnCopy(tu.getUebung(), user);

            TrainingUebung neueZuordnung = new TrainingUebung();
            neueZuordnung.setTraining(kopie);
            neueZuordnung.setUebung(eigeneUebung);
            neueZuordnung.setEmpfSaetze(tu.getEmpfSaetze());
            neueZuordnung.setEmpfDistanzMeter(tu.getEmpfDistanzMeter());
            neueZuordnung.setEmpfDauerSekunden(tu.getEmpfDauerSekunden());
            neueZuordnung.setPauseZwischenSaetzenSekunden(tu.getPauseZwischenSaetzenSekunden());
            neueZuordnung.setPauseNachUebungSekunden(tu.getPauseNachUebungSekunden());
            kopierteUebungen.add(neueZuordnung);
        }
        kopie.setUebungen(kopierteUebungen);

        return trainingRepository.save(kopie);
    }

    public Training getTraining(Long id, String username) {
        User user = getUser(username);
        return findAccessibleTraining(id, user);
    }

    @Transactional
    public Training createTraining(TrainingRequest request, String username) {
        User user = getUser(username);

        Training training = new Training();
        training.setName(request.getName());
        training.setBeschreibung(request.getBeschreibung());
        training.setDefaultPauseZwischenSaetzenSekunden(
                request.getDefaultPauseZwischenSaetzenSekunden() != null ? request.getDefaultPauseZwischenSaetzenSekunden() : 90);
        training.setDefaultPauseZwischenUebungenSekunden(
                request.getDefaultPauseZwischenUebungenSekunden() != null ? request.getDefaultPauseZwischenUebungenSekunden() : 120);
        training.setUser(user);
        training.setUebungen(buildTrainingUebungen(training, request.getUebungen(), user));

        return trainingRepository.save(training);
    }

    @Transactional
    public Training updateTraining(Long id, TrainingRequest request, String username) {
        User user = getUser(username);
        Training training = findOwnedTraining(id, user);

        training.setName(request.getName());
        training.setBeschreibung(request.getBeschreibung());
        training.setDefaultPauseZwischenSaetzenSekunden(
                request.getDefaultPauseZwischenSaetzenSekunden() != null ? request.getDefaultPauseZwischenSaetzenSekunden() : 90);
        training.setDefaultPauseZwischenUebungenSekunden(
                request.getDefaultPauseZwischenUebungenSekunden() != null ? request.getDefaultPauseZwischenUebungenSekunden() : 120);

        training.getUebungen().clear();
        training.getUebungen().addAll(buildTrainingUebungen(training, request.getUebungen(), user));

        return trainingRepository.save(training);
    }

    @Transactional
    public void deleteTraining(Long id, String username) {
        User user = getUser(username);
        Training training = findAccessibleTraining(id, user);

        if (training.getUser() == null) {
            trainingZuweisungRepository.deleteByUserIdAndTrainingId(user.getId(), id);
            return;
        }

        // Bereits geloggte Einheiten sollen erhalten bleiben, auch wenn der Plan geloescht wird -
        // der Trainingsname wurde beim Loggen bereits als Snapshot mitgespeichert.
        List<TrainingAusfuehrung> protokollierteEinheiten = trainingAusfuehrungRepository.findByTrainingId(id);
        protokollierteEinheiten.forEach(ta -> ta.setTraining(null));
        trainingAusfuehrungRepository.saveAll(protokollierteEinheiten);

        trainingRepository.delete(training);
    }

    private List<TrainingUebung> buildTrainingUebungen(Training training, List<TrainingUebungRequest> requests, User user) {
        List<TrainingUebung> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }

        for (TrainingUebungRequest item : requests) {
            Uebung uebung = uebungRepository.findById(item.getUebungId())
                    .orElseThrow(() -> new RuntimeException("Uebung not found"));

            if (!isUebungAccessible(uebung, user)) {
                throw new RuntimeException("Not authorized to use this uebung");
            }

            TrainingUebung trainingUebung = new TrainingUebung();
            trainingUebung.setTraining(training);
            trainingUebung.setUebung(uebung);
            trainingUebung.setEmpfSaetze(item.getEmpfSaetze());
            trainingUebung.setEmpfDistanzMeter(item.getEmpfDistanzMeter());
            trainingUebung.setEmpfDauerSekunden(item.getEmpfDauerSekunden());
            trainingUebung.setPauseZwischenSaetzenSekunden(item.getPauseZwischenSaetzenSekunden());
            trainingUebung.setPauseNachUebungSekunden(item.getPauseNachUebungSekunden());
            result.add(trainingUebung);
        }

        return result;
    }

    private boolean isUebungAccessible(Uebung uebung, User user) {
        if (uebung.getUser() != null) {
            return uebung.getUser().getId().equals(user.getId());
        }
        return uebungZuweisungRepository.existsByUserIdAndUebungId(user.getId(), uebung.getId());
    }

    /** Erlaubt Zugriff auf eigene UND zu "meinen" hinzugefuegte Bibliotheks-Trainings. */
    private Training findAccessibleTraining(Long id, User user) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Training not found"));

        boolean owned = training.getUser() != null && training.getUser().getId().equals(user.getId());
        boolean assigned = training.getUser() == null
                && trainingZuweisungRepository.existsByUserIdAndTrainingId(user.getId(), id);

        if (!owned && !assigned) {
            throw new RuntimeException("Not authorized to access this training");
        }

        return training;
    }

    /** Nur eigene Trainings duerfen bearbeitet werden - Bibliotheks-Trainings sind fuer alle gleich. */
    private Training findOwnedTraining(Long id, User user) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Training not found"));

        if (training.getUser() == null || !training.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to access this training");
        }

        return training;
    }

    private List<Training> getAssignedLibraryTrainings(User user) {
        return trainingZuweisungRepository.findByUserId(user.getId()).stream()
                .map(TrainingZuweisung::getTraining)
                .collect(Collectors.toList());
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
