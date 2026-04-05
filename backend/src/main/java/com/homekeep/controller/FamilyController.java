package com.homekeep.controller;

import com.homekeep.dto.*;
import com.homekeep.entity.User;
import com.homekeep.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<ApiResponse<FamilyDTO>> createFamily(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("家庭创建成功", familyService.createFamily(user, request)));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<FamilyDTO>> joinFamily(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JoinFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("加入家庭成功", familyService.joinFamily(user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FamilyDTO>>> getUserFamilies(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getUserFamilies(user)));
    }

    @GetMapping("/{familyId}")
    public ResponseEntity<ApiResponse<FamilyDTO>> getFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getFamilyById(user, familyId)));
    }

    @PutMapping("/{familyId}")
    public ResponseEntity<ApiResponse<FamilyDTO>> updateFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @Valid @RequestBody UpdateFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("家庭信息更新成功", familyService.updateFamily(user, familyId, request)));
    }

    @DeleteMapping("/{familyId}")
    public ResponseEntity<ApiResponse<Void>> deleteFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        familyService.deleteFamily(user, familyId);
        return ResponseEntity.ok(ApiResponse.success("家庭已删除", null));
    }

    @GetMapping("/{familyId}/members/{userId}")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> getMemberDetail(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getMemberDetail(user, familyId, userId)));
    }

    @PutMapping("/{familyId}/members/{userId}/permissions")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> updateMemberPermissions(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId,
            @RequestBody UpdateMemberPermissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("权限已更新", familyService.updateMemberPermissions(user, familyId, userId, request)));
    }

    @DeleteMapping("/{familyId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId) {
        familyService.removeMember(user, familyId, userId);
        return ResponseEntity.ok(ApiResponse.success("成员已移除", null));
    }

    @PostMapping("/{familyId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        familyService.leaveFamily(user, familyId);
        return ResponseEntity.ok(ApiResponse.success("已退出家庭", null));
    }
}
