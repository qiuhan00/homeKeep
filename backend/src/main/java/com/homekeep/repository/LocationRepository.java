package com.homekeep.repository;

import com.homekeep.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    // 系统默认位置
    List<Location> findByFamilyIdIsNullOrderByNameAsc();

    // 家庭私有位置
    List<Location> findByFamilyIdOrderByNameAsc(Long familyId);

    // 获取系统位置 + 家庭私有位置
    @Query(value = "SELECT * FROM locations WHERE family_id IS NULL OR family_id = :familyId ORDER BY is_system DESC, name ASC", nativeQuery = true)
    List<Location> findAllWithSystem(@Param("familyId") Long familyId);

    List<Location> findByFamilyIdAndParentId(Long familyId, Long parentId);

    // 获取根位置：系统根位置 + 家庭私有根位置
    @Query(value = "SELECT * FROM locations WHERE (family_id IS NULL OR family_id = :familyId) AND parent_id IS NULL ORDER BY is_system DESC, name ASC", nativeQuery = true)
    List<Location> findRootLocations(@Param("familyId") Long familyId);

    // 获取子位置
    List<Location> findByFamilyIdAndParentIdOrderByNameAsc(Long familyId, Long parentId);
}
