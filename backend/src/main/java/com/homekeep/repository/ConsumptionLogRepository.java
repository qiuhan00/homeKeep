package com.homekeep.repository;

import com.homekeep.entity.ConsumptionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsumptionLogRepository extends JpaRepository<ConsumptionLog, Long> {

    List<ConsumptionLog> findByItemIdOrderByLoggedAtDesc(Long itemId);

    List<ConsumptionLog> findByFamilyIdOrderByLoggedAtDesc(Long familyId);

    List<ConsumptionLog> findByFamilyIdAndLoggedAtAfterOrderByLoggedAtDesc(Long familyId, LocalDateTime after);
}
