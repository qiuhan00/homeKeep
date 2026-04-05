package com.homekeep.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "items", indexes = {
    @Index(name = "idx_family", columnList = "family_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity = 1;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "location_path", length = 100)
    private String locationPath;

    @Column(length = 50)
    private String category;

    @Column(length = 255)
    private String tags;

    @Column(name = "cover_image_url", length = 255)
    private String coverImageUrl;

    @Column(name = "custom_fields", columnDefinition = "JSON")
    private String customFields;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "expiry_days")
    private Integer expiryDays = 7;

    @Column(name = "is_alert")
    private Boolean isAlert = false;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "used_up")
    private Boolean usedUp = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
