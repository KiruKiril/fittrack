package com.fittrack.backend.service;

import com.fittrack.backend.dto.TrainingRequest;
import com.fittrack.backend.dto.TrainingUebungRequest;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.TrainingUebung;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TrainingRepository;
import com.fittrack.backend.repository.UebungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final UebungRepository uebungRepository;
    private final UserRepository userRepository;

    public TrainingService(TrainingRepository trainingRepository, UebungRepository uebungRepository, UserRepository userRepository) {
        this.trainingRepository = trainingRepository;
        this.uebungRepository = uebungRepository;
        this.userRepository = userRepository;
    }

    public List<Training> getAllTrainings(String username) {
        User user = getUser(username);
        return trainingRepository.findByUserId(user.getId());
    }

    public Training getTraining(Long id, String username) {
        User user = getUser(username);
        return findOwnedTraining(id, user);
    }

    @Transactional
    public Training createTraining(TrainingRequest request, String username) {
        User user = getUser(username);

        Training training = new Training();
        training.setName(request.getName());
        training.setBeschreibung(request.getBeschreibung());
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

        training.getUebungen().clear();
        training.getUebungen().addAll(buildTrainingUebungen(training, request.getUebungen(), user));

        return trainingRepository.save(training);
    }

    public void deleteTraining(Long id, String username) {
        User user = getUser(username);
        Training training = findOwnedTraining(id, user);
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

            if (!uebung.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Not authorized to use this uebung");
            }

            TrainingUebung trainingUebung = new TrainingUebung();
            trainingUebung.setTraining(training);
            trainingUebung.setUebung(uebung);
            trainingUebung.setEmpfSaetze(item.getEmpfSaetze());
            trainingUebung.setEmpfDistanzMeter(item.getEmpfDistanzMeter());
            trainingUebung.setEmpfDauerSekunden(item.getEmpfDauerSekunden());
            result.add(trainingUebung);
        }

        return result;
    }

    private Training findOwnedTraining(Long id, User user) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Training not found"));

        if (!training.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to access this training");
        }

        return training;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
