package com.homekeep.controller;

import com.homekeep.dto.ApiResponse;
import com.homekeep.dto.ConsumptionTrendDTO;
import com.homekeep.entity.User;
import com.homekeep.service.ConsumptionTrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/trends")
@RequiredArgsConstructor
public class ConsumptionTrendController {

    private final ConsumptionTrendService consumptionTrendService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsumptionTrendDTO>>> getAllTrends(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                consumptionTrendService.getAllTrends(familyId, user.getId())));
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<ConsumptionTrendDTO>> getItemTrend(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                consumptionTrendService.getItemTrend(familyId, itemId, user.getId())));
    }
}
