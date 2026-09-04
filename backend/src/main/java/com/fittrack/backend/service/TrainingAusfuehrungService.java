package com.fittrack.backend.service;

import com.fittrack.backend.dto.AusdauerEinheitRequest;
import com.fittrack.backend.dto.SatzRequest;
import com.fittrack.backend.dto.TrainingAusfuehrungRequest;
import com.fittrack.backend.dto.UebungSessionRequest;
import com.fittrack.backend.entity.AusdauerEinheit;
import com.fittrack.backend.entity.Satz;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.TrainingAusfuehrung;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungSession;
import com.fittrack.backend.entity.UebungTyp;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TrainingAusfuehrungRepository;
import com.fittrack.backend.repository.TrainingRepository;
import com.fittrack.backend.repository.UebungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrainingAusfuehrungService {

    private final TrainingAusfuehrungRepository trainingAusfuehrungRepository;
    private final TrainingRepository trainingRepository;
    private final UebungRepository uebungRepository;
    private final UserRepository userRepository;

    public TrainingAusfuehrungService(TrainingAusfuehrungRepository trainingAusfuehrungRepository,
                                       TrainingRepository trainingRepository,
                                       UebungRepository uebungRepository,
                                       UserRepository userRepository) {
        this.trainingAusfuehrungRepository = trainingAusfuehrungRepository;
        this.trainingRepository = trainingRepository;
        this.uebungRepository = uebungRepository;
        this.userRepository = userRepository;
    }

    public List<TrainingAusfuehrung> getAllTrainingAusfuehrungen(String username) {
        User user = getUser(username);
        return trainingAusfuehrungRepository.findByUserId(user.getId());
    }

    public TrainingAusfuehrung getTrainingAusfuehrung(Long id, String username) {
        User user = getUser(username);
        return findOwnedTrainingAusfuehrung(id, user);
    }

    @Transactional
    public TrainingAusfuehrung createTrainingAusfuehrung(TrainingAusfuehrungRequest request, String username) {
        User user = getUser(username);

        Training training = trainingRepository.findById(request.getTrainingId())
                .orElseThrow(() -> new RuntimeException("Training not found"));

        if (!training.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to use this training");
        }

        TrainingAusfuehrung trainingAusfuehrung = new TrainingAusfuehrung();
        trainingAusfuehrung.setTraining(training);
        trainingAusfuehrung.setUser(user);
        trainingAusfuehrung.setOrt(request.getOrt());
        trainingAusfuehrung.setDauerSekunden(request.getDauerSekunden());
        trainingAusfuehrung.setUebungSessions(buildUebungSessions(trainingAusfuehrung, request.getUebungSessions(), user));

        return trainingAusfuehrungRepository.save(trainingAusfuehrung);
    }

    @Transactional
    public TrainingAusfuehrung updateTrainingAusfuehrung(Long id, TrainingAusfuehrungRequest request, String username) {
        User user = getUser(username);
        TrainingAusfuehrung trainingAusfuehrung = findOwnedTrainingAusfuehrung(id, user);

        // Das Training (der Plan, auf dem der Eintrag basiert) bleibt beim Bearbeiten fix -
        // hier werden nur die tatsaechlich erfassten Werte korrigiert, nicht der Plan gewechselt.
        trainingAusfuehrung.setOrt(request.getOrt());

        trainingAusfuehrung.getUebungSessions().clear();
        trainingAusfuehrung.getUebungSessions().addAll(
                buildUebungSessions(trainingAusfuehrung, request.getUebungSessions(), user)
        );

        return trainingAusfuehrungRepository.save(trainingAusfuehrung);
    }

    public void deleteTrainingAusfuehrung(Long id, String username) {
        User user = getUser(username);
        TrainingAusfuehrung trainingAusfuehrung = findOwnedTrainingAusfuehrung(id, user);
        trainingAusfuehrungRepository.delete(trainingAusfuehrung);
    }

    private List<UebungSession> buildUebungSessions(TrainingAusfuehrung trainingAusfuehrung, List<UebungSessionRequest> requests, User user) {
        List<UebungSession> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }

        for (UebungSessionRequest item : requests) {
            Uebung uebung = uebungRepository.findById(item.getUebungId())
                    .orElseThrow(() -> new RuntimeException("Uebung not found"));

            if (!uebung.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Not authorized to use this uebung");
            }

            boolean hatSaetze = item.getSaetze() != null && !item.getSaetze().isEmpty();
            boolean hatAusdauerEinheiten = item.getAusdauerEinheiten() != null && !item.getAusdauerEinheiten().isEmpty();

            if (uebung.getTyp() == UebungTyp.KRAFT && hatAusdauerEinheiten) {
                throw new RuntimeException("Uebung '" + uebung.getName() + "' ist eine Kraftuebung und akzeptiert keine Ausdauer-Einheiten");
            }
            if (uebung.getTyp() == UebungTyp.AUSDAUER && hatSaetze) {
                throw new RuntimeException("Uebung '" + uebung.getName() + "' ist eine Ausdaueruebung und akzeptiert keine Saetze");
            }

            UebungSession uebungSession = new UebungSession();
            uebungSession.setTrainingAusfuehrung(trainingAusfuehrung);
            uebungSession.setUebung(uebung);
            uebungSession.setSaetze(buildSaetze(uebungSession, item.getSaetze()));
            uebungSession.setAusdauerEinheiten(buildAusdauerEinheiten(uebungSession, item.getAusdauerEinheiten()));
            result.add(uebungSession);
        }

        return result;
    }

    private List<Satz> buildSaetze(UebungSession uebungSession, List<SatzRequest> requests) {
        List<Satz> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }

        for (SatzRequest item : requests) {
            Satz satz = new Satz();
            satz.setUebungSession(uebungSession);
            satz.setWiederholungen(item.getWiederholungen());
            satz.setGewicht(item.getGewicht());
            satz.setDropset(item.isDropset());
            result.add(satz);
        }

        return result;
    }

    private List<AusdauerEinheit> buildAusdauerEinheiten(UebungSession uebungSession, List<AusdauerEinheitRequest> requests) {
        List<AusdauerEinheit> result = new ArrayList<>();
        if (requests == null) {
            return result;
        }

        for (AusdauerEinheitRequest item : requests) {
            AusdauerEinheit ausdauerEinheit = new AusdauerEinheit();
            ausdauerEinheit.setUebungSession(uebungSession);
            ausdauerEinheit.setDauerSekunden(item.getDauerSekunden());
            ausdauerEinheit.setDistanzMeter(item.getDistanzMeter());
            ausdauerEinheit.setHerzfrequenzDurchschnitt(item.getHerzfrequenzDurchschnitt());
            ausdauerEinheit.setHerzfrequenzMax(item.getHerzfrequenzMax());
            ausdauerEinheit.setHoehenmeter(item.getHoehenmeter());
            ausdauerEinheit.setNotiz(item.getNotiz());
            result.add(ausdauerEinheit);
        }

        return result;
    }

    private TrainingAusfuehrung findOwnedTrainingAusfuehrung(Long id, User user) {
        TrainingAusfuehrung trainingAusfuehrung = trainingAusfuehrungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TrainingAusfuehrung not found"));

        if (!trainingAusfuehrung.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to access this training ausfuehrung");
        }

        return trainingAusfuehrung;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
