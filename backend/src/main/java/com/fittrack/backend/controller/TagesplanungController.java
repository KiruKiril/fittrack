package com.fittrack.backend.controller;

import com.fittrack.backend.dto.TagesplanungRequest;
import com.fittrack.backend.dto.TagesplanungResponse;
import com.fittrack.backend.service.TagesplanungService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tagesplanungen")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Tagesplanungen", description = "Kalender-basierte Vorausplanung, welches Training an welchem Tag ansteht (begrenzt auf den Planungshorizont des Users)")
public class TagesplanungController {

    private final TagesplanungService tagesplanungService;

    public TagesplanungController(TagesplanungService tagesplanungService) {
        this.tagesplanungService = tagesplanungService;
    }

    @Operation(summary = "Alle Tagesplanungen des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<List<TagesplanungResponse>> getAll(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                tagesplanungService.getPlanungen(userDetails.getUsername())
                        .stream()
                        .map(TagesplanungResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @Operation(summary = "Training fuer einen bestimmten Tag planen (innerhalb des Planungshorizonts)")
    @PutMapping("/{datum}")
    public ResponseEntity<TagesplanungResponse> set(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate datum,
            @RequestBody TagesplanungRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                TagesplanungResponse.from(
                        tagesplanungService.setPlanung(datum, request.getTrainingId(), userDetails.getUsername())
                )
        );
    }

    @Operation(summary = "Planung fuer einen Tag entfernen")
    @DeleteMapping("/{datum}")
    public ResponseEntity<Void> delete(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate datum,
            @AuthenticationPrincipal UserDetails userDetails) {
        tagesplanungService.deletePlanung(datum, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
