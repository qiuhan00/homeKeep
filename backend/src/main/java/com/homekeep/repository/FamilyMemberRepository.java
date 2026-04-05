package com.homekeep.repository;

import com.homekeep.entity.FamilyMember;
import com.homekeep.entity.FamilyMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, FamilyMemberId> {
    List<FamilyMember> findByUserId(Long userId);
    List<FamilyMember> findByFamilyId(Long familyId);
    Optional<FamilyMember> findByFamilyIdAndUserId(Long familyId, Long userId);
    boolean existsByFamilyIdAndUserId(Long familyId, Long userId);
    void deleteByFamilyIdAndUserId(Long familyId, Long userId);
}
