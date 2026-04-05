package com.homekeep.entity;

import java.io.Serializable;

public class FamilyMemberId implements Serializable {
    private Long familyId;
    private Long userId;

    public FamilyMemberId() {}

    public FamilyMemberId(Long familyId, Long userId) {
        this.familyId = familyId;
        this.userId = userId;
    }

    public Long getFamilyId() { return familyId; }
    public Long getUserId() { return userId; }
}
