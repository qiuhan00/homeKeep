package com.homekeep.dto;

import lombok.Data;

@Data
public class UpdateMemberPermissionRequest {
    private Boolean canEditItems;
    private Boolean canInviteMembers;
    private Boolean canRemoveMembers;
}