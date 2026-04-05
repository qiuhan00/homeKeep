package com.homekeep.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "family_members")
@IdClass(FamilyMemberId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMember {

    @Id
    @Column(name = "family_id")
    private Long familyId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FamilyRole role = FamilyRole.MEMBER;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "can_edit_items")
    private Boolean canEditItems = false;

    @Column(name = "can_invite_members")
    private Boolean canInviteMembers = false;

    @Column(name = "can_remove_members")
    private Boolean canRemoveMembers = false;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    public boolean isOwner() {
        return this.role == FamilyRole.OWNER;
    }

    public boolean hasEditPermission() {
        return isOwner() || Boolean.TRUE.equals(canEditItems);
    }

    public boolean hasInvitePermission() {
        return isOwner() || Boolean.TRUE.equals(canInviteMembers);
    }

    public boolean hasRemovePermission() {
        return isOwner() || Boolean.TRUE.equals(canRemoveMembers);
    }

    public enum FamilyRole {
        OWNER, MEMBER
    }
}
