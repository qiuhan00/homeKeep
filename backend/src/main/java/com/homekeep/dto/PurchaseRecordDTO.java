package com.homekeep.dto;

import com.homekeep.entity.PurchaseRecord;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseRecordDTO {
    private Long id;
    private Long familyId;
    private Long purchaserId;
    private String purchaserNickname;
    private Double totalAmount;
    private LocalDateTime purchaseDate;
    private String notes;
    private List<PurchaseItemDTO> items;

    @Data
    public static class PurchaseItemDTO {
        private Long itemId;
        private String itemName;
        private Integer quantity;
        private Double price;
    }

    public static PurchaseRecordDTO fromEntity(PurchaseRecord record) {
        PurchaseRecordDTO dto = new PurchaseRecordDTO();
        dto.setId(record.getId());
        dto.setFamilyId(record.getFamilyId());
        dto.setPurchaserId(record.getPurchaserId());
        dto.setTotalAmount(record.getTotalAmount());
        dto.setPurchaseDate(record.getPurchaseDate());
        dto.setNotes(record.getNotes());
        return dto;
    }
}
