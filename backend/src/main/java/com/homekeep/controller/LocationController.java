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

    @PostMapping
    public ResponseEntity<ApiResponse<LocationDTO>> createLocation(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateLocationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("位置创建成功",
                locationService.createLocation(familyId, user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getLocations(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocations(familyId, user)));
    }

    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getRootLocations(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getRootLocations(familyId, user)));
    }

    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<LocationDTO>>> getChildLocations(
            @PathVariable Long familyId,
            @PathVariable Long parentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getChildLocations(familyId, parentId, user)));
    }

    @DeleteMapping("/{locationId}")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(
            @PathVariable Long familyId,
            @PathVariable Long locationId,
            @AuthenticationPrincipal User user) {
        locationService.deleteLocation(familyId, locationId, user);
        return ResponseEntity.ok(ApiResponse.success("位置删除成功", null));
    }
}
