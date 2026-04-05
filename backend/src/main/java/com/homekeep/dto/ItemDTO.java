package com.homekeep.dto;

import com.homekeep.entity.Item;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ItemDTO {
    private Long id;
    private Long familyId;
    private Long creatorId;
    private String creatorNickname;
    private String name;
    private String description;
    private Integer quantity;
    private Integer minQuantity;
    private Long locationId;
    private String locationPath;
    private String category;
    private String tags;
    private String coverImageUrl;
    private String customFields;
    private LocalDate expiryDate;
    private Integer expiryDays;
    private Boolean isAlert;
    private Boolean usedUp;
    private LocalDateTime updatedAt;

    public static ItemDTO fromEntity(Item item) {
        ItemDTO dto = new ItemDTO();
        dto.setId(item.getId());
        dto.setFamilyId(item.getFamilyId());
        dto.setCreatorId(item.getCreatorId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setQuantity(item.getQuantity());
        dto.setMinQuantity(item.getMinQuantity());
        dto.setLocationId(item.getLocationId());
        dto.setLocationPath(item.getLocationPath());
        dto.setCategory(item.getCategory());
        dto.setTags(item.getTags());
        dto.setCoverImageUrl(item.getCoverImageUrl());
        dto.setCustomFields(item.getCustomFields());
        dto.setExpiryDate(item.getExpiryDate());
        dto.setExpiryDays(item.getExpiryDays());
        dto.setIsAlert(item.getIsAlert());
        dto.setUsedUp(item.getUsedUp());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
