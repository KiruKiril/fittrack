package com.fittrack.backend.service;

import com.fittrack.backend.entity.Tagesplanung;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.User;
import com.fittrack.backend.repository.TagesplanungRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Kalender-basierte Vorausplanung, welches Training an welchem Tag ansteht (siehe Tagesplanung-
 * Entity). Bewusst nur fuer die nahe Zukunft gedacht - das rueckwirkende Loggen bereits
 * absolvierter Trainings (TrainingAusfuehrungService) ist davon unabhaengig und bleibt
 * unbegrenzt moeglich.
 */
@Service
public class TagesplanungService {

    private static final int DEFAULT_PLANUNGSHORIZONT_WOCHEN = 2;

    private final TagesplanungRepository tagesplanungRepository;
    private final TrainingService trainingService;
    private final UserRepository userRepository;

    public TagesplanungService(TagesplanungRepository tagesplanungRepository,
                                TrainingService trainingService,
                                UserRepository userRepository) {
        this.tagesplanungRepository = tagesplanungRepository;
        this.trainingService = trainingService;
        this.userRepository = userRepository;
    }

    public List<Tagesplanung> getPlanungen(String username) {
        User user = getUser(username);
        return tagesplanungRepository.findByUserId(user.getId());
    }

    @Transactional
    public Tagesplanung setPlanung(LocalDate datum, Long trainingId, String username) {
        User user = getUser(username);
        validateHorizont(datum, user);

        // getTraining() prueft bereits, dass der User Zugriff auf dieses Training hat.
        Training training = trainingService.getTraining(trainingId, username);

        Tagesplanung planung = tagesplanungRepository.findByUserIdAndDatum(user.getId(), datum)
                .orElseGet(() -> {
                    Tagesplanung neu = new Tagesplanung();
                    neu.setUser(user);
                    neu.setDatum(datum);
                    return neu;
                });
        planung.setTraining(training);

        return tagesplanungRepository.save(planung);
    }

    @Transactional
    public void deletePlanung(LocalDate datum, String username) {
        User user = getUser(username);
        tagesplanungRepository.deleteByUserIdAndDatum(user.getId(), datum);
    }

    private void validateHorizont(LocalDate datum, User user) {
        LocalDate heute = LocalDate.now();
        if (datum.isBefore(heute)) {
            throw new RuntimeException("Es kann nicht fuer die Vergangenheit geplant werden");
        }

        Integer eigenerHorizont = user.getPlanungshorizontWochen();
        int horizontWochen = eigenerHorizont != null ? eigenerHorizont : DEFAULT_PLANUNGSHORIZONT_WOCHEN;
        LocalDate maxDatum = heute.plusWeeks(horizontWochen);
        if (datum.isAfter(maxDatum)) {
            throw new RuntimeException("Planung ist nur bis zu " + horizontWochen + " Wochen im Voraus moeglich");
        }
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
