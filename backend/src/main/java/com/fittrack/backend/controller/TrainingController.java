package com.fittrack.backend.controller;

import com.fittrack.backend.dto.TrainingRequest;
import com.fittrack.backend.dto.TrainingResponse;
import com.fittrack.backend.service.TrainingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trainings")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Trainings", description = "Trainingsplaene: eine Sammlung von Uebungen mit Zielwerten (Saetze, Distanz oder Dauer)")
public class TrainingController {

    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @Operation(summary = "Alle Trainingsplaene des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<List<TrainingResponse>> getTrainings(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                trainingService.getAllTrainings(userDetails.getUsername())
                        .stream()
                        .map(TrainingResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Bibliotheks-Trainings abrufen, die der User noch nicht zu seinen hinzugefuegt hat")
    @GetMapping("/bibliothek")
    public ResponseEntity<List<TrainingResponse>> getBibliothek(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                trainingService.getLibraryTrainings(userDetails.getUsername())
                        .stream()
                        .map(TrainingResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Bibliotheks-Training zu 'meinen' Trainings hinzufuegen (inkl. dessen Uebungen)")
    @PostMapping("/bibliothek/{id}")
    public ResponseEntity<TrainingResponse> addFromBibliothek(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingResponse.from(
                        trainingService.addTrainingFromLibrary(id, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Einen Trainingsplan inkl. seiner Uebungen abrufen")
    @GetMapping("/{id}")
    public ResponseEntity<TrainingResponse> getTraining(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingResponse.from(trainingService.getTraining(id, userDetails.getUsername()))
        );
    }

    @Operation(summary = "Neuen Trainingsplan anlegen (mit Liste an Uebungen und deren Zielwerten)")
    @PostMapping
    public ResponseEntity<TrainingResponse> createTraining(
            @RequestBody TrainingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingResponse.from(
                        trainingService.createTraining(request, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Trainingsplan aktualisieren (ersetzt die Liste der Uebungen)")
    @PutMapping("/{id}")
    public ResponseEntity<TrainingResponse> updateTraining(
            @PathVariable Long id,
            @RequestBody TrainingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingResponse.from(
                        trainingService.updateTraining(id, request, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Trainingsplan entfernen (eigenen loeschen oder Bibliotheks-Training aus 'meinen' entfernen)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTraining(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        trainingService.deleteTraining(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
