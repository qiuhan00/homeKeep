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

    /**
     * 创建新物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @param request 创建物品请求，包含物品名称、数量、位置等信息
     * @return 创建成功的物品信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ItemDTO>> createItem(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("物品创建成功",
                itemService.createItem(familyId, user, request)));
    }

    /**
     * 获取家庭所有物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 物品列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItems(familyId, user)));
    }

    /**
     * 获取指定物品详情
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前登录用户
     * @return 物品详细信息
     */
    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDTO>> getItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getItem(familyId, itemId, user)));
    }

    /**
     * 更新物品信息
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前登录用户
     * @param request 更新物品请求
     * @return 更新后的物品信息
     */
    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDTO>> updateItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("物品更新成功",
                itemService.updateItem(familyId, itemId, user, request)));
    }

    /**
     * 删除物品
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前登录用户
     * @return 操作结果
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        itemService.deleteItem(familyId, itemId, user);
        return ResponseEntity.ok(ApiResponse.success("物品删除成功", null));
    }

    /**
     * 搜索物品
     * @param familyId 家庭ID
     * @param keyword 搜索关键词
     * @param user 当前登录用户
     * @return 匹配的物品列表
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> searchItems(
            @PathVariable Long familyId,
            @RequestParam String keyword,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.searchItems(familyId, keyword, user)));
    }

    /**
     * 获取库存不足的物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 库存不足的物品列表
     */
    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getLowStockItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getLowStockItems(familyId, user)));
    }

    /**
     * 获取已用完的物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 已用完的物品列表
     */
    @GetMapping("/used-up")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getUsedUpItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getUsedUpItems(familyId, user)));
    }

    /**
     * 调整物品数量
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前登录用户
     * @param body 请求体，包含 delta（数量变化值，正数增加，负数减少）
     * @return 更新后的物品信息
     */
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

    /**
     * 获取需要提醒的物品（库存不足或即将过期）
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 需要提醒的物品列表
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<Item>>> getAlertItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(alertService.getAlertItems(familyId, user)));
    }

    /**
     * 获取即将过期的物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 即将过期的物品列表
     */
    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> getExpiringItems(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getExpiringItems(familyId, user)));
    }

    /**
     * 获取仪表盘统计数据
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 统计数据（总物品数、库存不足数、即将过期数等）
     */
    @GetMapping("/stats/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(itemService.getDashboardStats(familyId, user)));
    }

    /**
     * 一键补货所有库存不足的物品
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 补货后的物品列表
     */
    @PostMapping("/restock-all")
    public ResponseEntity<ApiResponse<List<ItemDTO>>> restockAllLowStock(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("补货成功",
                itemService.restockAllLowStock(familyId, user)));
    }
}
