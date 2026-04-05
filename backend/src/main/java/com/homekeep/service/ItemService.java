package com.homekeep.service;

import com.homekeep.dto.CreateItemRequest;
import com.homekeep.dto.DashboardStatsDTO;
import com.homekeep.dto.ItemDTO;
import com.homekeep.dto.UpdateItemRequest;
import com.homekeep.entity.Item;
import com.homekeep.entity.Location;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.ItemRepository;
import com.homekeep.repository.LocationRepository;
import com.homekeep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;

    /**
     * 校验用户是否为家庭成员
     * @param familyId 家庭ID
     * @param user 当前用户
     * @throws BusinessException 用户不是家庭成员时抛出异常
     */
    public void validateFamilyAccess(Long familyId, User user) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }
    }

    /**
     * 获取用户的家庭成员信息
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 家庭成员实体
     * @throws BusinessException 用户不是家庭成员时抛出异常
     */
    private com.homekeep.entity.FamilyMember getFamilyMember(Long familyId, User user) {
        return familyMemberRepository.findByFamilyIdAndUserId(familyId, user.getId())
                .orElseThrow(() -> new BusinessException("您不是该家庭的成员"));
    }

    /**
     * 校验用户是否有编辑物品权限
     * @param familyId 家庭ID
     * @param user 当前用户
     * @throws BusinessException 用户没有编辑权限时抛出异常
     */
    private void validateEditPermission(Long familyId, User user) {
        com.homekeep.entity.FamilyMember member = getFamilyMember(familyId, user);
        if (!member.hasEditPermission()) {
            throw new BusinessException("您没有编辑物品的权限");
        }
    }

    /**
     * 创建新物品
     * @param familyId 家庭ID
     * @param user 当前用户
     * @param request 创建请求，包含物品名称、描述、数量、位置等信息
     * @return 创建成功的物品信息
     */
    @Transactional
    public ItemDTO createItem(Long familyId, User user, CreateItemRequest request) {
        validateFamilyAccess(familyId, user);
        validateEditPermission(familyId, user);

        Item item = new Item();
        item.setFamilyId(familyId);
        item.setCreatorId(user.getId());
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);
        item.setMinQuantity(request.getMinQuantity() != null ? request.getMinQuantity() : 1);
        item.setLocationId(request.getLocationId());
        item.setLocationPath(request.getLocationPath());
        item.setCategory(request.getCategory());
        item.setTags(request.getTags());
        item.setCoverImageUrl(request.getCoverImageUrl());
        item.setCustomFields(request.getCustomFields());
        item.setExpiryDate(request.getExpiryDate());
        item.setExpiryDays(request.getExpiryDays() != null ? request.getExpiryDays() : 7);

        checkLowStock(item);

        item = itemRepository.save(item);

        ItemDTO dto = ItemDTO.fromEntity(item);
        dto.setCreatorNickname(user.getNickname());
        return dto;
    }

    /**
     * 获取家庭的所有物品列表
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 物品列表，包含创建者昵称
     */
    public List<ItemDTO> getItems(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Item> items = itemRepository.findByFamilyIdAndIsDeletedFalse(familyId);
        return items.stream().map(item -> {
            ItemDTO dto = ItemDTO.fromEntity(item);
            userRepository.findById(item.getCreatorId())
                    .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 获取指定物品的详细信息
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前用户
     * @return 物品详细信息；物品不存在时抛出异常
     */
    public ItemDTO getItem(Long familyId, Long itemId, User user) {
        validateFamilyAccess(familyId, user);
        Item item = itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(itemId, familyId)
                .orElseThrow(() -> new BusinessException("物品不存在"));
        ItemDTO dto = ItemDTO.fromEntity(item);
        userRepository.findById(item.getCreatorId())
                .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
        return dto;
    }

    /**
     * 更新物品信息
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前用户
     * @param request 更新请求，包含要更新的字段
     * @return 更新后的物品信息；物品不存在时抛出异常
     */
    @Transactional
    public ItemDTO updateItem(Long familyId, Long itemId, User user, UpdateItemRequest request) {
        validateFamilyAccess(familyId, user);
        validateEditPermission(familyId, user);
        Item item = itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(itemId, familyId)
                .orElseThrow(() -> new BusinessException("物品不存在"));

        if (request.getName() != null) item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getQuantity() != null) item.setQuantity(request.getQuantity());
        if (request.getMinQuantity() != null) item.setMinQuantity(request.getMinQuantity());
        if (request.getLocationId() != null) item.setLocationId(request.getLocationId());
        if (request.getLocationPath() != null) item.setLocationPath(request.getLocationPath());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getTags() != null) item.setTags(request.getTags());
        if (request.getCoverImageUrl() != null) item.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getCustomFields() != null) item.setCustomFields(request.getCustomFields());
        if (request.getExpiryDate() != null) item.setExpiryDate(request.getExpiryDate());
        if (request.getExpiryDays() != null) item.setExpiryDays(request.getExpiryDays());
        if (request.getIsAlert() != null) item.setIsAlert(request.getIsAlert());

        checkLowStock(item);

        item = itemRepository.save(item);

        ItemDTO dto = ItemDTO.fromEntity(item);
        userRepository.findById(item.getCreatorId())
                .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
        return dto;
    }

    /**
     * 删除物品（软删除）
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param user 当前用户
     * @throws BusinessException 物品不存在时抛出异常
     */
    @Transactional
    public void deleteItem(Long familyId, Long itemId, User user) {
        validateFamilyAccess(familyId, user);
        validateEditPermission(familyId, user);
        Item item = itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(itemId, familyId)
                .orElseThrow(() -> new BusinessException("物品不存在"));
        item.setIsDeleted(true);
        itemRepository.save(item);
    }

    /**
     * 搜索物品
     * @param familyId 家庭ID
     * @param keyword 搜索关键词
     * @param user 当前用户
     * @return 匹配的物品列表
     */
    public List<ItemDTO> searchItems(Long familyId, String keyword, User user) {
        validateFamilyAccess(familyId, user);
        List<Item> items = itemRepository.searchByKeyword(familyId, keyword);
        return items.stream().map(item -> {
            ItemDTO dto = ItemDTO.fromEntity(item);
            userRepository.findById(item.getCreatorId())
                    .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
            if (item.getLocationId() != null) {
                locationRepository.findById(item.getLocationId())
                        .ifPresent(loc -> dto.setLocationPath(loc.getPath()));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 获取库存不足的物品列表
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 当前数量低于最小数量的物品列表
     */
    public List<ItemDTO> getLowStockItems(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Item> items = itemRepository.findLowStockItems(familyId);
        return items.stream().map(ItemDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 获取已用完的物品列表
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 数量为0的物品列表
     */
    public List<ItemDTO> getUsedUpItems(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Item> items = itemRepository.findUsedUpItems(familyId);
        return items.stream().map(ItemDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 获取即将过期的物品列表（7天内）
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 过期日期在7天内的物品列表
     */
    public List<ItemDTO> getExpiringItems(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        LocalDate today = LocalDate.now();
        LocalDate expiryThreshold = today.plusDays(7); // 默认7天内
        List<Item> items = itemRepository.findExpiringItems(familyId, today, expiryThreshold);
        return items.stream().map(item -> {
            ItemDTO dto = ItemDTO.fromEntity(item);
            userRepository.findById(item.getCreatorId())
                    .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 获取仪表盘统计数据
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 包含总数、库存不足数、已用完数、即将过期数等统计信息
     */
    public DashboardStatsDTO getDashboardStats(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Item> allItems = itemRepository.findByFamilyIdAndIsDeletedFalse(familyId);
        List<Item> lowStockItems = itemRepository.findLowStockItems(familyId);
        List<Item> usedUpItems = itemRepository.findUsedUpItems(familyId);

        LocalDate today = LocalDate.now();
        LocalDate expiryThreshold = today.plusDays(7);
        List<Item> expiringItems = itemRepository.findExpiringItems(familyId, today, expiryThreshold);

        long totalItems = allItems.size();
        long totalQuantity = allItems.stream().mapToLong(Item::getQuantity).sum();

        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalItems(totalItems);
        stats.setLowStockCount(lowStockItems.size());
        stats.setUsedUpCount(usedUpItems.size());
        stats.setExpiringCount(expiringItems.size());
        stats.setTotalQuantity(totalQuantity);
        stats.setLowStockPercent(totalItems > 0 ? (double) lowStockItems.size() / totalItems * 100 : 0);

        return stats;
    }

    /**
     * 一键补货所有库存不足的物品
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 补货后的物品列表，自动将数量补至最小数量
     */
    @Transactional
    public List<ItemDTO> restockAllLowStock(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        validateEditPermission(familyId, user);
        List<Item> lowStockItems = itemRepository.findLowStockItems(familyId);

        for (Item item : lowStockItems) {
            int delta = item.getMinQuantity() - item.getQuantity();
            if (delta > 0) {
                item.setQuantity(item.getQuantity() + delta);
                item.setUsedUp(false);
                item.setIsAlert(false);
                itemRepository.save(item);
            }
        }

        return lowStockItems.stream().map(ItemDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 调整物品数量
     * @param familyId 家庭ID
     * @param itemId 物品ID
     * @param delta 数量变化值，正数增加，负数减少
     * @param user 当前用户
     * @return 更新后的物品信息；数量为负时抛出异常
     */
    @Transactional
    public ItemDTO adjustQuantity(Long familyId, Long itemId, int delta, User user) {
        validateFamilyAccess(familyId, user);
        validateEditPermission(familyId, user);
        Item item = itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(itemId, familyId)
                .orElseThrow(() -> new BusinessException("物品不存在"));

        int newQuantity = item.getQuantity() + delta;
        if (newQuantity < 0) {
            throw new BusinessException("数量不能为负数");
        }
        item.setQuantity(newQuantity);

        // 标记已用完状态
        if (newQuantity == 0) {
            item.setUsedUp(true);
        } else {
            item.setUsedUp(false);
        }

        checkLowStock(item);

        item = itemRepository.save(item);

        ItemDTO dto = ItemDTO.fromEntity(item);
        userRepository.findById(item.getCreatorId())
                .ifPresent(u -> dto.setCreatorNickname(u.getNickname()));
        return dto;
    }

    /**
     * 检查物品是否库存不足，设置告警状态
     * @param item 物品实体
     */
    private void checkLowStock(Item item) {
        if (item.getQuantity() <= item.getMinQuantity()) {
            item.setIsAlert(true);
        } else {
            item.setIsAlert(false);
        }
    }
}
