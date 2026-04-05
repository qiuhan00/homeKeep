package com.homekeep.repository;

import com.homekeep.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByFamilyId(Long familyId);
    List<Location> findByFamilyIdAndParentId(Long familyId, Long parentId);
    List<Location> findByFamilyIdAndParentIdIsNull(Long familyId);
}
