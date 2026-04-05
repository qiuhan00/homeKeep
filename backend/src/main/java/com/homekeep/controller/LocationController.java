package com.homekeep.controller;

import com.homekeep.dto.*;
import com.homekeep.entity.User;
import com.homekeep.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    /**
     * 创建新位置
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @param request 创建位置请求，包含位置名称、父位置等信息
     * @return 创建成功的位置信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<LocationDTO>> createLocation(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateLocationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("位置创建成功",
                locationService.createLocation(familyId, user, request)));
    }

    /**
     * 获取家庭所有位置
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 位置列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getLocations(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocations(familyId, user)));
    }

    /**
     * 获取顶层位置（没有父级的主位置）
     * @param familyId 家庭ID
     * @param user 当前登录用户
     * @return 顶层位置列表
     */
    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getRootLocations(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getRootLocations(familyId, user)));
    }

    /**
     * 获取指定位置的子位置
     * @param familyId 家庭ID
     * @param parentId 父位置ID
     * @param user 当前登录用户
     * @return 子位置列表
     */
    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getChildLocations(
            @PathVariable Long familyId,
            @PathVariable Long parentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getChildLocations(familyId, parentId, user)));
    }

    /**
     * 删除位置
     * @param familyId 家庭ID
     * @param locationId 位置ID
     * @param user 当前登录用户
     * @return 操作结果
     */
    @DeleteMapping("/{locationId}")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(
            @PathVariable Long familyId,
            @PathVariable Long locationId,
            @AuthenticationPrincipal User user) {
        locationService.deleteLocation(familyId, locationId, user);
        return ResponseEntity.ok(ApiResponse.success("位置删除成功", null));
    }
}
