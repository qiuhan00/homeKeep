package com.homekeep.controller;

import com.homekeep.dto.ApiResponse;
import com.homekeep.dto.CreatePurchaseRequest;
import com.homekeep.dto.PurchaseRecordDTO;
import com.homekeep.entity.User;
import com.homekeep.service.PurchaseRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/purchases")
@RequiredArgsConstructor
public class PurchaseRecordController {

    private final PurchaseRecordService purchaseRecordService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseRecordDTO>>> getPurchaseHistory(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseRecordService.getPurchaseHistory(familyId, user)));
    }

    @GetMapping("/{purchaseId}")
    public ResponseEntity<ApiResponse<PurchaseRecordDTO>> getPurchaseById(
            @PathVariable Long familyId,
            @PathVariable Long purchaseId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseRecordService.getPurchaseById(familyId, purchaseId, user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseRecordDTO>> createPurchase(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePurchaseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("购买记录已创建",
                purchaseRecordService.createPurchase(familyId, user, request)));
    }

    @DeleteMapping("/{purchaseId}")
    public ResponseEntity<ApiResponse<Void>> deletePurchase(
            @PathVariable Long familyId,
            @PathVariable Long purchaseId,
            @AuthenticationPrincipal User user) {
        purchaseRecordService.deletePurchase(familyId, purchaseId, user);
        return ResponseEntity.ok(ApiResponse.success("购买记录已删除", null));
    }
}
