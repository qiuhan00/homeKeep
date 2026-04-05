package com.homekeep.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConsumptionTrendDTO {
    private Long itemId;
    private String itemName;
    private Integer currentQuantity;
    private Integer minQuantity;
    private Double avgDailyConsumption;
    private Integer daysUntilRestock;
    private LocalDate predictedRestockDate;
    private List<DailyConsumption> recentConsumption;

    @Data
    public static class DailyConsumption {
        private LocalDate date;
        private Integer consumption;
    }
}
