package com.fittrack.backend.controller;

import com.fittrack.backend.dto.TrainingAusfuehrungRequest;
import com.fittrack.backend.dto.TrainingAusfuehrungResponse;
import com.fittrack.backend.service.TrainingAusfuehrungService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/training-ausfuehrungen")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "TrainingAusfuehrungen", description = "Geloggte, tatsaechlich durchgefuehrte Trainings mit Saetzen (Kraft) oder Ausdauer-Einheiten")
public class TrainingAusfuehrungController {

    private final TrainingAusfuehrungService trainingAusfuehrungService;

    public TrainingAusfuehrungController(TrainingAusfuehrungService trainingAusfuehrungService) {
        this.trainingAusfuehrungService = trainingAusfuehrungService;
    }

    @Operation(summary = "Alle geloggten Trainings des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<List<TrainingAusfuehrungResponse>> getTrainingAusfuehrungen(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                trainingAusfuehrungService.getAllTrainingAusfuehrungen(userDetails.getUsername())
                        .stream()
                        .map(TrainingAusfuehrungResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Ein geloggtes Training inkl. Saetzen/Ausdauer-Einheiten abrufen")
    @GetMapping("/{id}")
    public ResponseEntity<TrainingAusfuehrungResponse> getTrainingAusfuehrung(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingAusfuehrungResponse.from(
                        trainingAusfuehrungService.getTrainingAusfuehrung(id, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Ein durchgefuehrtes Training loggen (mit Uebungssessions, die Saetze ODER Ausdauer-Einheiten enthalten, je nach Uebungstyp)")
    @PostMapping
    public ResponseEntity<TrainingAusfuehrungResponse> createTrainingAusfuehrung(
            @RequestBody TrainingAusfuehrungRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingAusfuehrungResponse.from(
                        trainingAusfuehrungService.createTrainingAusfuehrung(request, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Ein geloggtes Training nachtraeglich korrigieren (Ort, Saetze, Ausdauer-Einheiten)")
    @PutMapping("/{id}")
    public ResponseEntity<TrainingAusfuehrungResponse> updateTrainingAusfuehrung(
            @PathVariable Long id,
            @RequestBody TrainingAusfuehrungRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TrainingAusfuehrungResponse.from(
                        trainingAusfuehrungService.updateTrainingAusfuehrung(id, request, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Geloggtes Training loeschen")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrainingAusfuehrung(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        trainingAusfuehrungService.deleteTrainingAusfuehrung(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
