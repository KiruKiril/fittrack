package com.fittrack.backend.controller;

import com.fittrack.backend.dto.SplitRequest;
import com.fittrack.backend.dto.SplitResponse;
import com.fittrack.backend.entity.Split;
import com.fittrack.backend.service.SplitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
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
        String username = userDetails.getUsername();
        Long aktiveId = splitService.getActiveSplit(username).map(Split::getId).orElse(null);
        return ResponseEntity.ok(
                splitService.getAllSplits(username)
                        .stream()
                        .map(s -> SplitResponse.from(s, s.getId().equals(aktiveId)))
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Den vom User als 'aktiv' markierten Split abrufen (falls vorhanden)")
    @GetMapping("/aktiv")
    public ResponseEntity<SplitResponse> getActiveSplit(@AuthenticationPrincipal UserDetails userDetails) {
        Optional<Split> aktiver = splitService.getActiveSplit(userDetails.getUsername());
        return aktiver
                .map(s -> ResponseEntity.ok(SplitResponse.from(s, true)))
                .orElse(ResponseEntity.noContent().build());
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
        return ResponseEntity.ok(toResponse(splitService.addSplitFromLibrary(id, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Einen Split inkl. seiner Trainings abrufen")
    @GetMapping("/{id}")
    public ResponseEntity<SplitResponse> getSplit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toResponse(splitService.getSplit(id, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Neuen Split anlegen (mit geordneter Liste an Trainings, optional je mit Wochentag)")
    @PostMapping
    public ResponseEntity<SplitResponse> createSplit(
            @RequestBody SplitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toResponse(splitService.createSplit(request, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Split aktualisieren (ersetzt die Liste der Trainings)")
    @PutMapping("/{id}")
    public ResponseEntity<SplitResponse> updateSplit(
            @PathVariable Long id,
            @RequestBody SplitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toResponse(splitService.updateSplit(id, request, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Zum naechsten Training in der Reihenfolge des Splits weiterspringen")
    @PostMapping("/{id}/weiter")
    public ResponseEntity<SplitResponse> advance(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toResponse(splitService.advance(id, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Ein bestimmtes Training im Split gezielt als 'Naechstes' festlegen")
    @PutMapping("/{id}/naechstes/{splitTrainingId}")
    public ResponseEntity<SplitResponse> setNext(
            @PathVariable Long id,
            @PathVariable Long splitTrainingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(toResponse(splitService.setNext(id, splitTrainingId, userDetails.getUsername()), userDetails));
    }

    @Operation(summary = "Diesen Split als 'aktiven' Split des Users markieren")
    @PostMapping("/{id}/aktivieren")
    public ResponseEntity<SplitResponse> activate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                SplitResponse.from(splitService.activateSplit(id, userDetails.getUsername()), true)
        );
    }

    @Operation(summary = "Markierung als 'aktiver' Split aufheben (kein aktiver Split mehr)")
    @PostMapping("/deaktivieren")
    public ResponseEntity<Void> deactivate(@AuthenticationPrincipal UserDetails userDetails) {
        splitService.deactivateSplit(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Split loeschen")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSplit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        splitService.deleteSplit(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /** Baut die Response inkl. korrektem 'aktiv'-Flag - vermeidet, dass Mutationen wie
     *  advance()/setNext()/update() faelschlich aktiv=false zurueckmelden, obwohl der Split
     *  weiterhin der aktive Split des Users ist. */
    private SplitResponse toResponse(Split split, UserDetails userDetails) {
        Long aktiveId = splitService.getActiveSplit(userDetails.getUsername()).map(Split::getId).orElse(null);
        return SplitResponse.from(split, split.getId().equals(aktiveId));
    }
}
