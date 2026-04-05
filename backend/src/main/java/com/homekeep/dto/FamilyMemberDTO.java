package com.homekeep.dto;

import com.homekeep.entity.FamilyMember;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FamilyMemberDTO {
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String role;
    private LocalDateTime joinedAt;
    private Boolean canEditItems;
    private Boolean canInviteMembers;
    private Boolean canRemoveMembers;

    public static FamilyMemberDTO fromEntity(FamilyMember member, String nickname, String avatarUrl) {
        FamilyMemberDTO dto = new FamilyMemberDTO();
        dto.setUserId(member.getUserId());
        dto.setNickname(nickname);
        dto.setAvatarUrl(avatarUrl);
        dto.setRole(member.getRole().name());
        dto.setJoinedAt(member.getJoinedAt());
        // Owner always has all permissions
        if (member.isOwner()) {
            dto.setCanEditItems(true);
            dto.setCanInviteMembers(true);
            dto.setCanRemoveMembers(true);
        } else {
            dto.setCanEditItems(member.getCanEditItems());
            dto.setCanInviteMembers(member.getCanInviteMembers());
            dto.setCanRemoveMembers(member.getCanRemoveMembers());
        }
        return dto;
    }
}