package com.homekeep.service;

import com.homekeep.dto.LocationDistributionDTO;
import com.homekeep.entity.Item;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationDistributionService {

    private final ItemRepository itemRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public void validateFamilyAccess(Long familyId, Long userId) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
            throw new RuntimeException("您不是该家庭的成员");
        }
    }

    public List<LocationDistributionDTO> getDistribution(Long familyId, Long userId) {
        validateFamilyAccess(familyId, userId);

        List<Item> items = itemRepository.findByFamilyIdAndIsDeletedFalse(familyId);
        long totalItems = items.size();

        // 按位置路径分组
        Map<String, List<Item>> itemsByLocation = items.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getLocationPath() != null ? item.getLocationPath() : "未分类"
                ));

        List<LocationDistributionDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Item>> entry : itemsByLocation.entrySet()) {
            LocationDistributionDTO dto = new LocationDistributionDTO();
            dto.setLocationPath(entry.getKey());
            dto.setLocationName(entry.getKey());

            // 提取位置ID（如果有）
            items.stream()
                    .filter(i -> entry.getKey().equals(i.getLocationPath()))
                    .findFirst()
                    .ifPresent(i -> dto.setLocationId(i.getLocationId()));

            dto.setItemCount((long) entry.getValue().size());
            dto.setPercent(totalItems > 0 ? Math.round((double) entry.getValue().size() / totalItems * 10000) / 100.0 : 0);

            List<LocationDistributionDTO.ItemSummary> summaries = entry.getValue().stream()
                    .map(item -> {
                        LocationDistributionDTO.ItemSummary summary = new LocationDistributionDTO.ItemSummary();
                        summary.setId(item.getId());
                        summary.setName(item.getName());
                        summary.setQuantity(item.getQuantity());
                        return summary;
                    })
                    .collect(Collectors.toList());
            dto.setItems(summaries);

            result.add(dto);
        }

        // 按物品数量降序排序
        result.sort((a, b) -> Long.compare(b.getItemCount(), a.getItemCount()));

        return result;
    }
}
