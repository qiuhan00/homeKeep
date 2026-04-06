package com.homekeep.service;

import com.homekeep.dto.CategoryDTO;
import com.homekeep.dto.CreateCategoryRequest;
import com.homekeep.entity.Category;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.CategoryRepository;
import com.homekeep.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public void validateFamilyAccess(Long familyId, User user) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }
    }

    @Transactional
    public CategoryDTO createCategory(Long familyId, User user, CreateCategoryRequest request) {
        validateFamilyAccess(familyId, user);

        Category category = new Category();
        category.setFamilyId(familyId);
        category.setName(request.getName());
        category.setParentId(request.getParentId());
        category.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        category.setIsSystem(false);  // 用户创建的都是家庭私有分类

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException("父级分类不存在"));
            category.setPath(parent.getPath());
        } else {
            category.setPath("");
        }

        category = categoryRepository.save(category);

        if (category.getPath() == null || category.getPath().isEmpty()) {
            category.setPath(category.getName());
        } else {
            category.setPath(category.getPath() + " / " + category.getName());
        }
        category = categoryRepository.save(category);

        return CategoryDTO.fromEntity(category);
    }

    // 获取系统默认分类 + 家庭私有分类
    public List<CategoryDTO> getCategories(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Category> categories = categoryRepository.findAllWithSystem(familyId);
        return categories.stream().map(CategoryDTO::fromEntity).collect(Collectors.toList());
    }

    public List<CategoryDTO> getRootCategories(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Category> categories = categoryRepository.findRootCategories(familyId);
        return categories.stream().map(CategoryDTO::fromEntity).collect(Collectors.toList());
    }

    public List<CategoryDTO> getChildCategories(Long familyId, Long parentId, User user) {
        validateFamilyAccess(familyId, user);
        List<Category> categories = categoryRepository.findByFamilyIdAndParentIdOrderBySortOrderAscNameAsc(familyId, parentId);
        return categories.stream().map(CategoryDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void deleteCategory(Long familyId, Long categoryId, User user) {
        validateFamilyAccess(familyId, user);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException("分类不存在"));
        // 只能删除家庭私有分类，不能删除系统默认分类
        if (category.getFamilyId() == null || !category.getFamilyId().equals(familyId)) {
            throw new BusinessException("无法删除系统默认分类");
        }
        categoryRepository.delete(category);
    }
}