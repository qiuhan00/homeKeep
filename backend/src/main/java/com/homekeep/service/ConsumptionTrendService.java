package com.homekeep.service;

import com.homekeep.dto.ConsumptionTrendDTO;
import com.homekeep.entity.ConsumptionLog;
import com.homekeep.entity.Item;
import com.homekeep.repository.ConsumptionLogRepository;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsumptionTrendService {

    private final ConsumptionLogRepository consumptionLogRepository;
    private final ItemRepository itemRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public void validateFamilyAccess(Long familyId, Long userId) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
            throw new RuntimeException("您不是该家庭的成员");
        }
    }

    public List<ConsumptionTrendDTO> getAllTrends(Long familyId, Long userId) {
        validateFamilyAccess(familyId, userId);

        List<Item> items = itemRepository.findByFamilyIdAndIsDeletedFalse(familyId);
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        List<ConsumptionLog> recentLogs = consumptionLogRepository.findByFamilyIdAndLoggedAtAfterOrderByLoggedAtDesc(familyId, thirtyDaysAgo);

        // 按物品分组计算消耗
        Map<Long, List<ConsumptionLog>> logsByItem = recentLogs.stream()
                .filter(log -> log.getQuantity() < 0) // 只看消耗，不看补充
                .collect(Collectors.groupingBy(ConsumptionLog::getItemId));

        return items.stream().map(item -> {
            ConsumptionTrendDTO dto = new ConsumptionTrendDTO();
            dto.setItemId(item.getId());
            dto.setItemName(item.getName());
            dto.setCurrentQuantity(item.getQuantity());
            dto.setMinQuantity(item.getMinQuantity());

            List<ConsumptionLog> itemLogs = logsByItem.getOrDefault(item.getId(), Collections.emptyList());
            int totalConsumption = itemLogs.stream().mapToInt(ConsumptionLog::getQuantity).map(Math::abs).sum();

            // 计算日均消耗
            long daysSpan = 30;
            if (!itemLogs.isEmpty()) {
                LocalDateTime earliest = itemLogs.stream()
                        .map(ConsumptionLog::getLoggedAt)
                        .min(LocalDateTime::compareTo)
                        .orElse(LocalDateTime.now().minusDays(30));
                daysSpan = ChronoUnit.DAYS.between(earliest, LocalDateTime.now());
                if (daysSpan < 1) daysSpan = 1;
            }

            double avgDaily = (double) totalConsumption / daysSpan;
            dto.setAvgDailyConsumption(Math.round(avgDaily * 100.0) / 100.0);

            // 计算预计补货日期
            if (avgDaily > 0) {
                int daysUntil = (int) Math.ceil(item.getQuantity() / avgDaily);
                dto.setDaysUntilRestock(daysUntil);
                dto.setPredictedRestockDate(LocalDate.now().plusDays(daysUntil));
            } else {
                dto.setDaysUntilRestock(null);
                dto.setPredictedRestockDate(null);
            }

            // 最近7天消耗
            List<ConsumptionTrendDTO.DailyConsumption> recentConsumption = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDate day = LocalDate.now().minusDays(i);
                final LocalDate targetDay = day;
                int dayConsumption = itemLogs.stream()
                        .filter(log -> {
                            LocalDate logDate = log.getLoggedAt().toLocalDate();
                            return logDate.equals(targetDay);
                        })
                        .mapToInt(ConsumptionLog::getQuantity).map(Math::abs).sum();

                ConsumptionTrendDTO.DailyConsumption dc = new ConsumptionTrendDTO.DailyConsumption();
                dc.setDate(day);
                dc.setConsumption(dayConsumption);
                recentConsumption.add(dc);
            }
            dto.setRecentConsumption(recentConsumption);

            return dto;
        }).collect(Collectors.toList());
    }

    public ConsumptionTrendDTO getItemTrend(Long familyId, Long itemId, Long userId) {
        validateFamilyAccess(familyId, userId);

        Item item = itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(itemId, familyId)
                .orElseThrow(() -> new RuntimeException("物品不存在"));

        List<ConsumptionTrendDTO> allTrends = getAllTrends(familyId, userId);
        return allTrends.stream()
                .filter(t -> t.getItemId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("趋势数据不存在"));
    }
}
