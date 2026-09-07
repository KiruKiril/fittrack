package com.fittrack.backend.controller;

import com.fittrack.backend.dto.UserPreferencesRequest;
import com.fittrack.backend.dto.UserPreferencesResponse;
import com.fittrack.backend.service.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/praeferenzen")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "User-Praeferenzen", description = "Persoenliche Einstellungen des eingeloggten Users (z.B. Planungshorizont)")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @Operation(summary = "Praeferenzen des eingeloggten Users abrufen")
    @GetMapping
    public ResponseEntity<UserPreferencesResponse> get(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                new UserPreferencesResponse(userPreferencesService.getPlanungshorizontWochen(userDetails.getUsername()))
        );
    }

    @Operation(summary = "Praeferenzen des eingeloggten Users aktualisieren")
    @PutMapping
    public ResponseEntity<UserPreferencesResponse> update(
            @RequestBody UserPreferencesRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        int wochen = userPreferencesService.updatePlanungshorizontWochen(
                request.getPlanungshorizontWochen(), userDetails.getUsername());
        return ResponseEntity.ok(new UserPreferencesResponse(wochen));
    }
}
