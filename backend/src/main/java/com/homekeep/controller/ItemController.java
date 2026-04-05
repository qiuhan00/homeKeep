package com.homekeep.controller;

import com.homekeep.dto.*;
import com.homekeep.entity.Item;
import com.homekeep.entity.User;
import com.homekeep.service.AlertService;
import com.homekeep.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/families/{familyId}/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final AlertService alertService;

    @PostMapping
    public ResponseEntity<ApiResponse<ItemDTO>> createItem(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("物品创建成功",
                itemService.createItem(familyId, user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItems(familyId, user)));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDTO>> getItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItem(familyId, itemId, user)));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDTO>> updateItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("物品更新成功",
                itemService.updateItem(familyId, itemId, user, request)));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        itemService.deleteItem(familyId, itemId, user);
        return ResponseEntity.ok(ApiResponse.success("物品删除成功", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> searchItems(
            @PathVariable Long familyId,
            @RequestParam String keyword,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.searchItems(familyId, keyword, user)));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getLowStockItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getLowStockItems(familyId, user)));
    }

    @GetMapping("/used-up")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getUsedUpItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getUsedUpItems(familyId, user)));
    }

    @PostMapping("/{itemId}/adjust")
    public ResponseEntity<ApiResponse<ItemDTO>> adjustQuantity(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> body) {
        Integer delta = body.get("delta");
        if (delta == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("delta 参数不能为空"));
        }
        return ResponseEntity.ok(ApiResponse.success("数量调整成功",
                itemService.adjustQuantity(familyId, itemId, delta, user)));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<Item>>> getAlertItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(alertService.getAlertItems(familyId, user)));
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getExpiringItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getExpiringItems(familyId, user)));
    }

    @GetMapping("/stats/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getDashboardStats(familyId, user)));
    }

    @PostMapping("/restock-all")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> restockAllLowStock(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("补货成功",
                itemService.restockAllLowStock(familyId, user)));
    }
}
