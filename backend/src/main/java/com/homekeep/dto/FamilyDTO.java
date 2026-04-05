package com.homekeep.dto;

import com.homekeep.entity.Family;
import com.homekeep.entity.FamilyMember;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FamilyDTO {
    private Long id;
    private String name;
    private String inviteCode;
    private List<MemberDTO> members;
    private LocalDateTime createdAt;

    @Data
    public static class MemberDTO {
        private Long userId;
        private String nickname;
        private String avatarUrl;
        private FamilyMember.FamilyRole role;
        private LocalDateTime joinedAt;
        private Boolean canEditItems;
        private Boolean canInviteMembers;
        private Boolean canRemoveMembers;
    }

    public static FamilyDTO fromEntity(Family family, List<FamilyMember> members) {
        FamilyDTO dto = new FamilyDTO();
        dto.setId(family.getId());
        dto.setName(family.getName());
        dto.setInviteCode(family.getInviteCode());
        dto.setCreatedAt(family.getCreatedAt());
        return dto;
    }
}
