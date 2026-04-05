package com.homekeep.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateItemRequest {
    @NotBlank(message = "物品名称不能为空")
    private String name;

    private String description;

    @Min(value = 0, message = "数量不能为负数")
    private Integer quantity = 1;

    @Min(value = 0, message = "最低数量不能为负数")
    private Integer minQuantity = 1;

    private Long locationId;

    private String locationPath;

    private String category;

    private String tags;

    private String coverImageUrl;

    private String customFields;

    private LocalDate expiryDate;

    private Integer expiryDays = 7;
}
