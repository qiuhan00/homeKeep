package com.homekeep.dto;

import com.homekeep.entity.Location;
import lombok.Data;
import java.util.List;

@Data
public class LocationDTO {
    private Long id;
    private Long familyId;
    private String name;
    private Long parentId;
    private String path;
    private Boolean isSystem;
    private List<LocationDTO> children;

    public static LocationDTO fromEntity(Location location) {
        LocationDTO dto = new LocationDTO();
        dto.setId(location.getId());
        dto.setFamilyId(location.getFamilyId());
        dto.setName(location.getName());
        dto.setParentId(location.getParentId());
        dto.setPath(location.getPath());
        dto.setIsSystem(location.getIsSystem());
        return dto;
    }
}
