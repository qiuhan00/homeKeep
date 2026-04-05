package com.homekeep.repository;

import com.homekeep.entity.PurchaseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRecordRepository extends JpaRepository<PurchaseRecord, Long> {

    List<PurchaseRecord> findByFamilyIdOrderByPurchaseDateDesc(Long familyId);
}
