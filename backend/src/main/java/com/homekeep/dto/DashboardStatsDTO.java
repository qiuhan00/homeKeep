package com.homekeep.dto;

import lombok.Data;

@Data
public class DashboardStatsDTO {
    private long totalItems;           // 总物品数
    private long lowStockCount;        // 低库存物品数
    private double lowStockPercent;    // 低库存占比
    private long usedUpCount;          // 已用完物品数
    private long expiringCount;        // 即将过期物品数(7天内)
    private long totalQuantity;        // 库存总量
}
