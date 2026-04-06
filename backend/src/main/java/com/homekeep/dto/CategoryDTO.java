package com.homekeep.dto;

import com.homekeep.entity.Category;
import lombok.Data;

@Data
public class CategoryDTO {
    private Long id;
    private Long familyId;
    private String name;
    private Long parentId;
    private String path;
    private Integer sortOrder;
    private Boolean isSystem;

    public static CategoryDTO fromEntity(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setFamilyId(category.getFamilyId());
        dto.setName(category.getName());
        dto.setParentId(category.getParentId());
        dto.setPath(category.getPath());
        dto.setSortOrder(category.getSortOrder());
        dto.setIsSystem(category.getIsSystem());
        return dto;
    }
}