package com.homekeep.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreatePurchaseRequest {

    @NotNull(message = "购买日期不能为空")
    private LocalDateTime purchaseDate;

    private String notes;

    @NotEmpty(message = "购买物品不能为空")
    private List<PurchaseItem> items;

    @Data
    public static class PurchaseItem {
        private Long itemId;
        private String itemName;
        private Integer quantity;
        private Double price;
    }
}
