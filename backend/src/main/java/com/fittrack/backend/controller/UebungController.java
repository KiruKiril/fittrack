package com.fittrack.backend.controller;

import com.fittrack.backend.dto.UebungRequest;
import com.fittrack.backend.dto.UebungResponse;
import com.fittrack.backend.service.UebungService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/uebungen")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Uebungen", description = "Uebungsdefinitionen (Kraft oder Ausdauer) des eingeloggten Users")
public class UebungController {
    private final UebungService uebungService;

    public UebungController(UebungService uebungService) {
        this.uebungService = uebungService;
    }

    @Operation(summary = "Alle Uebungen des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<List<UebungResponse>> getUebungen(@AuthenticationPrincipal UserDetails userDetails) {
        Map<Long, List<String>> verwendetInTrainings = uebungService.getTrainingNamesByUebungId(userDetails.getUsername());
        return ResponseEntity.ok(
                uebungService.getAllUebungen(userDetails.getUsername())
                        .stream()
                        .map(u -> UebungResponse.from(u, verwendetInTrainings.getOrDefault(u.getId(), Collections.emptyList())))
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Neue Uebung anlegen (typ=KRAFT oder AUSDAUER)")
    @PostMapping
    public ResponseEntity<UebungResponse> createUebung(
            @RequestBody UebungRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                UebungResponse.from(
                        uebungService.createUebung(request, userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Uebung entfernen (eigene loeschen oder Bibliotheks-Uebung aus 'meinen' entfernen)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUebung(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        uebungService.deleteUebung(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Bibliotheks-Uebungen abrufen, die der User noch nicht zu seinen hinzugefuegt hat")
    @GetMapping("/bibliothek")
    public ResponseEntity<List<UebungResponse>> getBibliothek(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                uebungService.getLibraryUebungen(userDetails.getUsername())
                        .stream()
                        .map(UebungResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Bibliotheks-Uebung zu 'meinen' Uebungen hinzufuegen")
    @PostMapping("/bibliothek/{id}")
    public ResponseEntity<UebungResponse> addFromBibliothek(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                UebungResponse.from(
                        uebungService.addUebungFromLibrary(id, userDetails.getUsername())
                )
        );
    }
}
