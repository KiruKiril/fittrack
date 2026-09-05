package com.fittrack.backend.controller;

import com.fittrack.backend.dto.SplitRequest;
import com.fittrack.backend.dto.SplitResponse;
import com.fittrack.backend.service.SplitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/splits")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Splits", description = "Geordnete Abfolge mehrerer Trainings (z.B. Push/Pull/Legs), optional mit Wochentagen")
public class SplitController {

    private final SplitService splitService;

    public SplitController(SplitService splitService) {
        this.splitService = splitService;
    }

    @Operation(summary = "Alle Splits des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<List<SplitResponse>> getSplits(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                splitService.getAllSplits(userDetails.getUsername())
                        .stream()
                        .map(SplitResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Bibliotheks-Splits abrufen, die der User noch nicht als eigene Kopie hat")
    @GetMapping("/bibliothek")
    public ResponseEntity<List<SplitResponse>> getBibliothek(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                splitService.getLibrarySplits(userDetails.getUsername())
                        .stream()
                        .map(SplitResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Bibliotheks-Split als eigene Kopie uebernehmen (inkl. dessen Trainings und Uebungen)")
    @PostMapping("/bibliothek/{id}")
    public ResponseEntity<SplitResponse> addFromBibliothek(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                SplitResponse.from(
                        splitService.addSplitFromLibrary(id, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Einen Split inkl. seiner Trainings abrufen")
    @GetMapping("/{id}")
    public ResponseEntity<SplitResponse> getSplit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(SplitResponse.from(splitService.getSplit(id, userDetails.getUsername())));
    }

    @Operation(summary = "Neuen Split anlegen (mit geordneter Liste an Trainings, optional je mit Wochentag)")
    @PostMapping
    public ResponseEntity<SplitResponse> createSplit(
            @RequestBody SplitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                SplitResponse.from(splitService.createSplit(request, userDetails.getUsername()))
        );
    }

    @Operation(summary = "Split aktualisieren (ersetzt die Liste der Trainings)")
    @PutMapping("/{id}")
    public ResponseEntity<SplitResponse> updateSplit(
            @PathVariable Long id,
            @RequestBody SplitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                SplitResponse.from(splitService.updateSplit(id, request, userDetails.getUsername()))
        );
    }

    @Operation(summary = "Zum naechsten Training in der Reihenfolge des Splits weiterspringen")
    @PostMapping("/{id}/weiter")
    public ResponseEntity<SplitResponse> advance(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                SplitResponse.from(splitService.advance(id, userDetails.getUsername()))
        );
    }

    @Operation(summary = "Split loeschen")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSplit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        splitService.deleteSplit(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
