package com.homekeep.dto;

import com.homekeep.entity.Location;
import lombok.Data;
import java.util.List;

@Data
public class LocationDTO {
    private Long id;
    private String name;
    private Long parentId;
    private String path;
    private List<LocationDTO> children;

    public static LocationDTO fromEntity(Location location) {
        LocationDTO dto = new LocationDTO();
        dto.setId(location.getId());
        dto.setName(location.getName());
        dto.setParentId(location.getParentId());
        dto.setPath(location.getPath());
        return dto;
    }
}
