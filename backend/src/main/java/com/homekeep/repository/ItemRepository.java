package com.homekeep.repository;

import com.homekeep.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByFamilyIdAndIsDeletedFalse(Long familyId);

    Optional<Item> findByIdAndFamilyIdAndIsDeletedFalse(Long id, Long familyId);

    List<Item> findByLocationIdAndIsDeletedFalse(Long locationId);

    @Query("SELECT i FROM Item i WHERE i.familyId = :familyId AND i.isDeleted = false " +
           "AND (i.name LIKE %:keyword% OR i.description LIKE %:keyword% OR i.category LIKE %:keyword% OR i.tags LIKE %:keyword%)")
    List<Item> searchByKeyword(@Param("familyId") Long familyId, @Param("keyword") String keyword);

    @Query("SELECT i FROM Item i WHERE i.familyId = :familyId AND i.isDeleted = false " +
           "AND i.usedUp = false AND i.quantity <= i.minQuantity")
    List<Item> findLowStockItems(@Param("familyId") Long familyId);

    List<Item> findByFamilyIdAndIsAlertTrueAndIsDeletedFalse(Long familyId);

    @Query("SELECT i FROM Item i WHERE i.familyId = :familyId AND i.isDeleted = false " +
           "AND i.expiryDate IS NOT NULL AND i.expiryDate <= :expiryThreshold " +
           "AND i.expiryDate >= :today")
    List<Item> findExpiringItems(@Param("familyId") Long familyId, @Param("today") LocalDate today, @Param("expiryThreshold") LocalDate expiryThreshold);

    @Query("SELECT i FROM Item i WHERE i.familyId = :familyId AND i.isDeleted = false " +
           "AND i.usedUp = true")
    List<Item> findUsedUpItems(@Param("familyId") Long familyId);
}
