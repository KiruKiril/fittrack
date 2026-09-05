package com.fittrack.backend.config;

import com.fittrack.backend.entity.Split;
import com.fittrack.backend.entity.SplitTraining;
import com.fittrack.backend.entity.Sportart;
import com.fittrack.backend.entity.Training;
import com.fittrack.backend.entity.TrainingUebung;
import com.fittrack.backend.entity.Uebung;
import com.fittrack.backend.entity.UebungTyp;
import com.fittrack.backend.repository.SplitRepository;
import com.fittrack.backend.repository.SportartRepository;
import com.fittrack.backend.repository.TrainingRepository;
import com.fittrack.backend.repository.UebungRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Legt beim ersten Start eine feste Bibliothek an Uebungen und Trainingsplaenen an
 * (user = null), die allen Usern zur Auswahl stehen und zu "meinen" hinzugefuegt werden koennen.
 * Laeuft nur, solange noch keine Bibliotheks-Uebungen existieren (idempotent ueber Neustarts hinweg).
 */
@Component
public class LibraryDataSeeder implements CommandLineRunner {

    private final UebungRepository uebungRepository;
    private final TrainingRepository trainingRepository;
    private final SplitRepository splitRepository;
    private final SportartRepository sportartRepository;

    public LibraryDataSeeder(UebungRepository uebungRepository, TrainingRepository trainingRepository,
                              SplitRepository splitRepository, SportartRepository sportartRepository) {
        this.uebungRepository = uebungRepository;
        this.trainingRepository = trainingRepository;
        this.splitRepository = splitRepository;
        this.sportartRepository = sportartRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (uebungRepository.countByUserIsNull() > 0) {
            return;
        }

        Map<String, Uebung> uebungen = new HashMap<>();
        uebungen.put("Kniebeuge", kraftUebung("Kniebeuge", "Langhantel auf dem Ruecken, Huefte tief absenken.", 10));
        uebungen.put("Bankdruecken", kraftUebung("Bankdruecken", "Langhantel oder Kurzhanteln, flache Bank.", 8));
        uebungen.put("Kreuzheben", kraftUebung("Kreuzheben", "Langhantel vom Boden zur Huefte, Ruecken gerade.", 6));
        uebungen.put("Klimmzug", kraftUebung("Klimmzug", "Obergriff an der Stange, Kinn ueber die Stange.", 8));
        uebungen.put("Rudern", kraftUebung("Rudern (Langhantel)", "Vorgebeugt, Langhantel zum Bauch ziehen.", 10));
        uebungen.put("Schulterdruecken", kraftUebung("Schulterdruecken", "Kurzhanteln oder Langhantel ueber Kopf druecken.", 10));
        uebungen.put("BizepsCurls", kraftUebung("Bizeps Curls", "Kurzhanteln, Ellbogen am Koerper.", 12));
        uebungen.put("TrizepsDips", kraftUebung("Trizeps Dips", "An Baenken oder am Barren, Oberkoerper absenken.", 12));
        uebungen.put("Ausfallschritte", kraftUebung("Ausfallschritte", "Abwechselnd grosse Schritte nach vorne, Knie absenken.", 12));
        uebungen.put("Beinpresse", kraftUebung("Beinpresse", "An der Maschine, Beine strecken.", 12));

        uebungen.put("Laufen", ausdauerUebung("Laufen"));
        uebungen.put("Radfahren", ausdauerUebung("Rad fahren"));
        uebungen.put("Schwimmen", ausdauerUebung("Schwimmen"));
        uebungen.put("Rudergeraet", ausdauerUebung("Rudergeraet"));
        uebungen.put("Seilspringen", ausdauerUebung("Seilspringen"));

        uebungRepository.saveAll(uebungen.values());

        Training ganzkoerper = new Training();
        ganzkoerper.setName("Ganzkoerper Einsteiger");
        ganzkoerper.setBeschreibung("Klassisches Ganzkoerpertraining fuer den Einstieg ins Krafttraining.");
        ganzkoerper.setDefaultPauseZwischenSaetzenSekunden(90);
        ganzkoerper.setDefaultPauseZwischenUebungenSekunden(120);
        ganzkoerper.setUebungen(List.of(
                trainingUebung(ganzkoerper, uebungen.get("Kniebeuge"), 3),
                trainingUebung(ganzkoerper, uebungen.get("Bankdruecken"), 3),
                trainingUebung(ganzkoerper, uebungen.get("Rudern"), 3),
                trainingUebung(ganzkoerper, uebungen.get("Schulterdruecken"), 3)
        ));

        Training pushPull = new Training();
        pushPull.setName("Oberkoerper Push/Pull");
        pushPull.setBeschreibung("Fokus auf Brust, Schulter, Ruecken und Arme.");
        pushPull.setDefaultPauseZwischenSaetzenSekunden(90);
        pushPull.setDefaultPauseZwischenUebungenSekunden(120);
        pushPull.setUebungen(List.of(
                trainingUebung(pushPull, uebungen.get("Bankdruecken"), 4),
                trainingUebung(pushPull, uebungen.get("Schulterdruecken"), 3),
                trainingUebung(pushPull, uebungen.get("Klimmzug"), 3),
                trainingUebung(pushPull, uebungen.get("Rudern"), 4),
                trainingUebung(pushPull, uebungen.get("TrizepsDips"), 3),
                trainingUebung(pushPull, uebungen.get("BizepsCurls"), 3)
        ));

        Training beine = new Training();
        beine.setName("Beine & Rumpf");
        beine.setBeschreibung("Beintraining mit Fokus auf Kraft und Stabilitaet.");
        beine.setDefaultPauseZwischenSaetzenSekunden(90);
        beine.setDefaultPauseZwischenUebungenSekunden(120);
        beine.setUebungen(List.of(
                trainingUebung(beine, uebungen.get("Kniebeuge"), 4),
                trainingUebung(beine, uebungen.get("Kreuzheben"), 3),
                trainingUebung(beine, uebungen.get("Beinpresse"), 3),
                trainingUebung(beine, uebungen.get("Ausfallschritte"), 3)
        ));

        Training cardio = new Training();
        cardio.setName("Cardio Basics");
        cardio.setBeschreibung("Einfaches Ausdauertraining zum Einstieg.");
        cardio.setDefaultPauseZwischenSaetzenSekunden(60);
        cardio.setDefaultPauseZwischenUebungenSekunden(90);
        cardio.setUebungen(List.of(
                ausdauerTrainingUebung(cardio, uebungen.get("Laufen"), 3000.0, 1200),
                ausdauerTrainingUebung(cardio, uebungen.get("Radfahren"), 8000.0, 1200)
        ));

        // Machbarkeitsnachweis fuer die Sportart-Filterung (offen erweiterbare Liste, siehe
        // Sportart-Entity): zwei Beispiel-Sportarten, mit denen bestehende Bibliotheks-Trainings
        // getaggt werden. Weitere Sportarten koennen jederzeit ohne Code-Aenderung ergaenzt werden.
        Sportart bodybuilding = sportart("Bodybuilding");
        Sportart laufen = sportart("Laufen");

        ganzkoerper.setSportarten(List.of(bodybuilding));
        pushPull.setSportarten(List.of(bodybuilding));
        beine.setSportarten(List.of(bodybuilding));
        cardio.setSportarten(List.of(laufen));

        trainingRepository.saveAll(List.of(ganzkoerper, pushPull, beine, cardio));

        // Machbarkeitsnachweis fuer Splits: eine einfache 3er-Rotation ohne feste Wochentage,
        // die auf den bereits gesaeten Bibliotheks-Trainings aufbaut.
        Split rotation = new Split();
        rotation.setName("Ganzkoerper 3er-Rotation");
        rotation.setBeschreibung("Einfacher Split ohne feste Wochentage: der Reihe nach durchlaufen und wiederholen.");
        rotation.setAktuellerIndex(0);
        rotation.setSportarten(List.of(bodybuilding));
        rotation.setTrainings(List.of(
                splitTraining(rotation, pushPull, 1),
                splitTraining(rotation, beine, 2),
                splitTraining(rotation, ganzkoerper, 3)
        ));
        splitRepository.save(rotation);
    }

    private Sportart sportart(String name) {
        return sportartRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Sportart neu = new Sportart();
            neu.setName(name);
            return sportartRepository.save(neu);
        });
    }

    private SplitTraining splitTraining(Split split, Training training, int reihenfolge) {
        SplitTraining st = new SplitTraining();
        st.setSplit(split);
        st.setTraining(training);
        st.setReihenfolge(reihenfolge);
        return st;
    }

    private Uebung kraftUebung(String name, String beschreibung, int empfWiederholungen) {
        Uebung uebung = new Uebung();
        uebung.setName(name);
        uebung.setTyp(UebungTyp.KRAFT);
        uebung.setBeschreibung(beschreibung);
        uebung.setEmpfWiederholungen(empfWiederholungen);
        return uebung;
    }

    private Uebung ausdauerUebung(String name) {
        Uebung uebung = new Uebung();
        uebung.setName(name);
        uebung.setTyp(UebungTyp.AUSDAUER);
        return uebung;
    }

    private TrainingUebung trainingUebung(Training training, Uebung uebung, int saetze) {
        TrainingUebung tu = new TrainingUebung();
        tu.setTraining(training);
        tu.setUebung(uebung);
        tu.setEmpfSaetze(saetze);
        return tu;
    }

    private TrainingUebung ausdauerTrainingUebung(Training training, Uebung uebung, double distanzMeter, int dauerSekunden) {
        TrainingUebung tu = new TrainingUebung();
        tu.setTraining(training);
        tu.setUebung(uebung);
        tu.setEmpfDistanzMeter(distanzMeter);
        tu.setEmpfDauerSekunden(dauerSekunden);
        return tu;
    }
}
