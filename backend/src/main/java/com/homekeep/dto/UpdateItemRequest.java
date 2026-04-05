package com.homekeep.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateItemRequest {
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
}
