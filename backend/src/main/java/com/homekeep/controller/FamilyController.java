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

    /**
     * 创建新家庭
     * @param user 当前登录用户
     * @param request 创建家庭请求，包含家庭名称等信息
     * @return 创建成功的家庭信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FamilyDTO>> createFamily(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("家庭创建成功", familyService.createFamily(user, request)));
    }

    /**
     * 加入已有家庭
     * @param user 当前登录用户
     * @param request 加入家庭请求，包含家庭邀请码
     * @return 加入成功的家庭信息
     */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<FamilyDTO>> joinFamily(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JoinFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("加入家庭成功", familyService.joinFamily(user, request)));
    }

    /**
     * 获取当前用户的所有家庭列表
     * @param user 当前登录用户
     * @return 用户所属的所有家庭列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FamilyDTO>>> getUserFamilies(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getUserFamilies(user)));
    }

    /**
     * 获取指定家庭详情
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @return 家庭详细信息
     */
    @GetMapping("/{familyId}")
    public ResponseEntity<ApiResponse<FamilyDTO>> getFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getFamilyById(user, familyId)));
    }

    /**
     * 更新家庭信息
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @param request 更新家庭请求，包含新的家庭名称等信息
     * @return 更新后的家庭信息
     */
    @PutMapping("/{familyId}")
    public ResponseEntity<ApiResponse<FamilyDTO>> updateFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @Valid @RequestBody UpdateFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("家庭信息更新成功", familyService.updateFamily(user, familyId, request)));
    }

    /**
     * 删除家庭（仅家庭所有者可操作）
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @return 操作结果
     */
    @DeleteMapping("/{familyId}")
    public ResponseEntity<ApiResponse<Void>> deleteFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        familyService.deleteFamily(user, familyId);
        return ResponseEntity.ok(ApiResponse.success("家庭已删除", null));
    }

    /**
     * 获取家庭成员详细信息
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @param userId 成员用户ID
     * @return 成员详细信息
     */
    @GetMapping("/{familyId}/members/{userId}")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> getMemberDetail(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getMemberDetail(user, familyId, userId)));
    }

    /**
     * 更新家庭成员权限
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @param userId 成员用户ID
     * @param request 权限更新请求
     * @return 更新后的成员信息
     */
    @PutMapping("/{familyId}/members/{userId}/permissions")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> updateMemberPermissions(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId,
            @RequestBody UpdateMemberPermissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("权限已更新", familyService.updateMemberPermissions(user, familyId, userId, request)));
    }

    /**
     * 移除家庭成员（仅家庭所有者可操作）
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @param userId 要移除的成员用户ID
     * @return 操作结果
     */
    @DeleteMapping("/{familyId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId,
            @PathVariable Long userId) {
        familyService.removeMember(user, familyId, userId);
        return ResponseEntity.ok(ApiResponse.success("成员已移除", null));
    }

    /**
     * 退出家庭
     * @param user 当前登录用户
     * @param familyId 家庭ID
     * @return 操作结果
     */
    @PostMapping("/{familyId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveFamily(
            @AuthenticationPrincipal User user,
            @PathVariable Long familyId) {
        familyService.leaveFamily(user, familyId);
        return ResponseEntity.ok(ApiResponse.success("已退出家庭", null));
    }
}
