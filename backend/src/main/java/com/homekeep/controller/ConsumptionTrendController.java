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

    /**
     * 获取家庭所有物品的消耗趋势
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 所有物品的消耗趋势列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsumptionTrendDTO>>> getAllTrends(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                consumptionTrendService.getAllTrends(familyId, user.getId())));
    }

    /**
     * 获取指定物品的消耗趋势
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前登录用户
     * @return 物品的消耗趋势信息
     */
    @GetMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<ConsumptionTrendDTO>> getItemTrend(
            @PathVariable Long familyId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                consumptionTrendService.getItemTrend(familyId, itemId, user.getId())));
    }
}
