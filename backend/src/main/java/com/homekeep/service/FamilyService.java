package com.homekeep.service;

import com.homekeep.dto.*;
import com.homekeep.entity.Family;
import com.homekeep.entity.FamilyMember;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.FamilyRepository;
import com.homekeep.repository.UserRepository;
import com.homekeep.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public FamilyDTO createFamily(User user, CreateFamilyRequest request) {
        Family family = new Family();
        family.setName(request.getName());
        family.setOwnerId(user.getId());
        family.setInviteCode(generateInviteCode());

        family = familyRepository.save(family);

        FamilyMember ownerMember = new FamilyMember();
        ownerMember.setFamilyId(family.getId());
        ownerMember.setUserId(user.getId());
        ownerMember.setRole(FamilyMember.FamilyRole.OWNER);
        familyMemberRepository.save(ownerMember);

        return FamilyDTO.fromEntity(family, List.of(ownerMember));
    }

    @Transactional
    public FamilyDTO joinFamily(User user, JoinFamilyRequest request) {
        Family family = familyRepository.findByInviteCode(request.getInviteCode())
                .orElseThrow(() -> new BusinessException("邀请码无效"));

        if (familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), user.getId())) {
            throw new BusinessException("您已经是该家庭的成员");
        }

        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getId());
        member.setUserId(user.getId());
        member.setRole(FamilyMember.FamilyRole.MEMBER);
        familyMemberRepository.save(member);

        List<FamilyMember> members = familyMemberRepository.findByFamilyId(family.getId());
        return FamilyDTO.fromEntity(family, members);
    }

    public List<FamilyDTO> getUserFamilies(User user) {
        List<FamilyMember> memberships = familyMemberRepository.findByUserId(user.getId());
        return memberships.stream().map(membership -> {
            Family family = familyRepository.findById(membership.getFamilyId()).orElse(null);
            if (family == null) return null;
            List<FamilyMember> members = familyMemberRepository.findByFamilyId(family.getId());
            FamilyDTO dto = FamilyDTO.fromEntity(family, members);
            dto.setMembers(members.stream().map(m -> mapToMemberDTO(m)).collect(Collectors.toList()));
            return dto;
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public FamilyDTO getFamilyById(User user, Long familyId) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }

        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new BusinessException("家庭不存在"));

        List<FamilyMember> members = familyMemberRepository.findByFamilyId(familyId);
        FamilyDTO dto = FamilyDTO.fromEntity(family, members);
        dto.setMembers(members.stream().map(m -> mapToMemberDTO(m)).collect(Collectors.toList()));
        return dto;
    }

    public FamilyMemberDTO getMemberDetail(User user, Long familyId, Long targetUserId) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, targetUserId)
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        return FamilyMemberDTO.fromEntity(member, targetUser.getNickname(), targetUser.getAvatarUrl());
    }

    @Transactional
    public FamilyMemberDTO updateMemberPermissions(User user, Long familyId, Long targetUserId, UpdateMemberPermissionRequest request) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        if (!member.isOwner()) {
            throw new BusinessException("只有家庭所有者可以修改成员权限");
        }

        FamilyMember targetMember = familyMemberRepository.findByFamilyIdAndUserId(familyId, targetUserId)
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        if (targetMember.isOwner()) {
            throw new BusinessException("不能修改所有者的权限");
        }

        if (request.getCanEditItems() != null) targetMember.setCanEditItems(request.getCanEditItems());
        if (request.getCanInviteMembers() != null) targetMember.setCanInviteMembers(request.getCanInviteMembers());
        if (request.getCanRemoveMembers() != null) targetMember.setCanRemoveMembers(request.getCanRemoveMembers());

        targetMember = familyMemberRepository.save(targetMember);

        User targetUser = userRepository.findById(targetUserId).orElseThrow();
        return FamilyMemberDTO.fromEntity(targetMember, targetUser.getNickname(), targetUser.getAvatarUrl());
    }

    @Transactional
    public void removeMember(User user, Long familyId, Long targetUserId) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        FamilyMember targetMember = familyMemberRepository.findByFamilyIdAndUserId(familyId, targetUserId)
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        // Owner can remove anyone, others can only remove with permission
        if (!member.isOwner() && !member.hasRemovePermission()) {
            throw new BusinessException("您没有权限移除成员");
        }

        // Cannot remove owner
        if (targetMember.isOwner()) {
            throw new BusinessException("不能移除家庭所有者");
        }

        familyMemberRepository.delete(targetMember);
    }

    @Transactional
    public void leaveFamily(User user, Long familyId) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        if (member.isOwner()) {
            throw new BusinessException("所有者不能退出家庭，请先转让所有权或删除家庭");
        }

        familyMemberRepository.delete(member);
    }

    @Transactional
    public void deleteFamily(User user, Long familyId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new BusinessException("家庭不存在"));

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        if (!member.isOwner()) {
            throw new BusinessException("只有家庭所有者可以删除家庭");
        }

        // Delete all family members first
        familyMemberRepository.deleteAll(familyMemberRepository.findByFamilyId(familyId));
        // Then delete the family
        familyRepository.delete(family);
    }

    @Transactional
    public FamilyDTO updateFamily(User user, Long familyId, UpdateFamilyRequest request) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new BusinessException("家庭不存在"));

        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));
        if (member.getRole() != FamilyMember.FamilyRole.OWNER) {
            throw new BusinessException("只有家庭所有者可以修改家庭信息");
        }

        family.setName(request.getName());
        family = familyRepository.save(family);

        List<FamilyMember> members = familyMemberRepository.findByFamilyId(familyId);
        return FamilyDTO.fromEntity(family, members);
    }

    private String generateInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (familyRepository.existsByInviteCode(code));
        return code;
    }

    private FamilyDTO.MemberDTO mapToMemberDTO(FamilyMember m) {
        FamilyDTO.MemberDTO memberDTO = new FamilyDTO.MemberDTO();
        memberDTO.setUserId(m.getUserId());
        memberDTO.setRole(m.getRole());
        memberDTO.setJoinedAt(m.getJoinedAt());
        // Owner always has all permissions
        if (m.isOwner()) {
            memberDTO.setCanEditItems(true);
            memberDTO.setCanInviteMembers(true);
            memberDTO.setCanRemoveMembers(true);
        } else {
            memberDTO.setCanEditItems(m.getCanEditItems());
            memberDTO.setCanInviteMembers(m.getCanInviteMembers());
            memberDTO.setCanRemoveMembers(m.getCanRemoveMembers());
        }
        userRepository.findById(m.getUserId()).ifPresent(u -> {
            memberDTO.setNickname(u.getNickname());
            memberDTO.setAvatarUrl(u.getAvatarUrl());
        });
        return memberDTO;
    }
}
