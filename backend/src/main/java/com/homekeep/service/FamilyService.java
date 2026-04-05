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

    /**
     * 创建新家庭
     * @param user 当前用户
     * @param request 创建请求，包含家庭名称
     * @return 创建成功返回家庭信息和成员列表
     */
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

    /**
     * 通过邀请码加入家庭
     * @param user 当前用户
     * @param request 加入请求，包含邀请码
     * @return 加入成功返回家庭信息和成员列表；邀请码无效或已是成员时抛出异常
     */
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

    /**
     * 获取当前用户的所有家庭列表
     * @param user 当前用户
     * @return 用户加入的所有家庭列表，包含每个家庭的成员信息
     */
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

    /**
     * 获取指定家庭的详细信息
     * @param user 当前用户
     * @param familyId 家庭ID
     * @return 家庭信息和成员列表；用户不是成员或家庭不存在时抛出异常
     */
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

    /**
     * 获取家庭成员的详细信息
     * @param user 当前用户
     * @param familyId 家庭ID
     * @param targetUserId 目标用户ID
     * @return 成员详细信息，包括昵称和头像；成员不存在时抛出异常
     */
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

    /**
     * 更新家庭成员的权限
     * @param user 当前用户（必须是所有者）
     * @param familyId 家庭ID
     * @param targetUserId 目标用户ID
     * @param request 权限更新请求，包含编辑物品、邀请成员、移除成员权限
     * @return 更新后的成员信息；无权限或目标成员是所有者时抛出异常
     */
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

    /**
     * 移除家庭成员
     * @param user 当前用户
     * @param familyId 家庭ID
     * @param targetUserId 要移除的用户ID
     * @throws BusinessException 无权限移除或目标是所有者时抛出异常
     */
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

    /**
     * 退出家庭
     * @param user 当前用户
     * @param familyId 家庭ID
     * @throws BusinessException 所有者不能退出家庭时抛出异常
     */
    @Transactional
    public void leaveFamily(User user, Long familyId) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("家庭成员不存在"));

        if (member.isOwner()) {
            throw new BusinessException("所有者不能退出家庭，请先转让所有权或删除家庭");
        }

        familyMemberRepository.delete(member);
    }

    /**
     * 删除家庭（仅所有者可操作）
     * @param user 当前用户
     * @param familyId 家庭ID
     * @throws BusinessException 非所有者删除时抛出异常；会同时删除所有成员和家庭
     */
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

    /**
     * 更新家庭信息
     * @param user 当前用户（必须是所有者）
     * @param familyId 家庭ID
     * @param request 更新请求，包含新的家庭名称
     * @return 更新后的家庭信息
     */
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

    /**
     * 生成唯一的邀请码
     * @return 6位大写字母数字组合的邀请码
     */
    private String generateInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (familyRepository.existsByInviteCode(code));
        return code;
    }

    /**
     * 将FamilyMember实体映射为MemberDTO
     * @param m 家庭成员实体
     * @return 包含成员信息的DTO，包括昵称、头像和完整权限
     */
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
