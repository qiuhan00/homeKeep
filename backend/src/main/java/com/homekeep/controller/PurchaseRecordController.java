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

    /**
     * 获取购买历史记录
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 购买记录列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseRecordDTO>>> getPurchaseHistory(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseRecordService.getPurchaseHistory(familyId, user)));
    }

    /**
     * 获取指定购买记录详情
     * @param familyId 家庭ID
     * @param purchaseId 购买记录ID
     * @param user 当前登录用户
     * @return 购买记录详细信息
     */
    @GetMapping("/{purchaseId}")
    public ResponseEntity<ApiResponse<PurchaseRecordDTO>> getPurchaseById(
            @PathVariable Long familyId,
            @PathVariable Long purchaseId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseRecordService.getPurchaseById(familyId, purchaseId, user)));
    }

    /**
     * 创建购买记录
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @param request 购买记录请求，包含物品ID、购买数量等信息
     * @return 创建的购买记录信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseRecordDTO>> createPurchase(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePurchaseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("购买记录已创建",
                purchaseRecordService.createPurchase(familyId, user, request)));
    }

    /**
     * 删除购买记录
     * @param familyId 家庭ID
     * @param purchaseId 购买记录ID
     * @param user 当前登录用户
     * @return 操作结果
     */
    @DeleteMapping("/{purchaseId}")
    public ResponseEntity<ApiResponse<Void>> deletePurchase(
            @PathVariable Long familyId,
            @PathVariable Long purchaseId,
            @AuthenticationPrincipal User user) {
        purchaseRecordService.deletePurchase(familyId, purchaseId, user);
        return ResponseEntity.ok(ApiResponse.success("购买记录已删除", null));
    }
}
