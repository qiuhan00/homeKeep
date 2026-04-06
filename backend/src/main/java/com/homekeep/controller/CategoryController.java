package com.homekeep.controller;

import com.homekeep.dto.*;
import com.homekeep.entity.User;
import com.homekeep.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategory(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("分类创建成功",
                categoryService.createCategory(familyId, user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getCategories(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategories(familyId, user)));
    }

    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getRootCategories(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getRootCategories(familyId, user)));
    }

    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getChildCategories(
            @PathVariable Long familyId,
            @PathVariable Long parentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getChildCategories(familyId, parentId, user)));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long familyId,
            @PathVariable Long categoryId,
            @AuthenticationPrincipal User user) {
        categoryService.deleteCategory(familyId, categoryId, user);
        return ResponseEntity.ok(ApiResponse.success("分类删除成功", null));
    }
}