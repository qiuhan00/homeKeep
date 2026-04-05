package com.homekeep.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumption_logs", indexes = {
    @Index(name = "idx_consumption_family", columnList = "family_id"),
    @Index(name = "idx_consumption_item", columnList = "item_id"),
    @Index(name = "idx_consumption_date", columnList = "logged_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "quantity_before")
    private Integer quantityBefore;

    @Column(name = "quantity_after")
    private Integer quantityAfter;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    @Column(length = 50)
    private String reason;

    @PrePersist
    protected void onCreate() {
        if (loggedAt == null) {
            loggedAt = LocalDateTime.now();
        }
    }
}
