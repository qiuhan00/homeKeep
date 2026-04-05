package com.homekeep.dto;

import lombok.Data;
import java.util.List;

@Data
public class LocationDistributionDTO {
    private Long locationId;
    private String locationName;
    private String locationPath;
    private Long itemCount;
    private Double percent;
    private List<ItemSummary> items;

    @Data
    public static class ItemSummary {
        private Long id;
        private String name;
        private Integer quantity;
    }
}
