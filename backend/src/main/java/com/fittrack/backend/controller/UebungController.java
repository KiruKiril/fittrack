package com.fittrack.backend.controller;

import com.fittrack.backend.dto.UebungRequest;
import com.fittrack.backend.dto.UebungResponse;
import com.fittrack.backend.service.UebungService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/uebungen")
@CrossOrigin(origins = "http://localhost:4200")
public class UebungController {
    private final UebungService uebungService;

    public UebungController(UebungService uebungService) {
        this.uebungService = uebungService;
    }

    @GetMapping
    public ResponseEntity<List<UebungResponse>> getUebungen(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                uebungService.getAllUebungen(userDetails.getUsername())
                        .stream()
                        .map(UebungResponse::from)
                        .collect(Collectors.toList())
        );
    }

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUebung(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        uebungService.deleteUebung(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

}
