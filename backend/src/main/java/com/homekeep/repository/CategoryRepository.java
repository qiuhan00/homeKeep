package com.homekeep.repository;

import com.homekeep.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 系统默认分类
    List<Category> findByFamilyIdIsNullOrderBySortOrderAscNameAsc();

    // 家庭私有分类
    List<Category> findByFamilyIdOrderBySortOrderAscNameAsc(Long familyId);

    // 获取系统分类 + 家庭私有分类
    @Query(value = "SELECT * FROM categories WHERE family_id IS NULL OR family_id = :familyId ORDER BY is_system DESC, sort_order ASC, name ASC", nativeQuery = true)
    List<Category> findAllWithSystem(@Param("familyId") Long familyId);

    // 获取系统根分类 + 家庭私有根分类
    @Query(value = "SELECT * FROM categories WHERE family_id IS NULL OR family_id = :familyId ORDER BY is_system DESC, sort_order ASC, name ASC", nativeQuery = true)
    List<Category> findRootCategories(@Param("familyId") Long familyId);

    List<Category> findByFamilyIdAndParentIdIsNullOrderBySortOrderAscNameAsc(Long familyId);
    List<Category> findByFamilyIdAndParentIdOrderBySortOrderAscNameAsc(Long familyId, Long parentId);

    // 检查分类名是否已存在（针对家庭私有分类）
    boolean existsByFamilyIdAndName(Long familyId, String name);
}