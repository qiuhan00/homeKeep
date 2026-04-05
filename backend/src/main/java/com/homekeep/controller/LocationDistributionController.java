package com.homekeep.controller;

import com.homekeep.dto.ApiResponse;
import com.homekeep.dto.LocationDistributionDTO;
import com.homekeep.entity.User;
import com.homekeep.service.LocationDistributionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/distribution")
@RequiredArgsConstructor
public class LocationDistributionController {

    private final LocationDistributionService locationDistributionService;

    /**
     * 获取物品位置分布统计
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 各位置的物品分布列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationDistributionDTO>>> getDistribution(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                locationDistributionService.getDistribution(familyId, user.getId())));
    }
}
