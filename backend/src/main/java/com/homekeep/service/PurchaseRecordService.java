package com.homekeep.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homekeep.dto.CreatePurchaseRequest;
import com.homekeep.dto.PurchaseRecordDTO;
import com.homekeep.entity.Item;
import com.homekeep.entity.PurchaseRecord;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.ItemRepository;
import com.homekeep.repository.PurchaseRecordRepository;
import com.homekeep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseRecordService {

    private final PurchaseRecordRepository purchaseRecordRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final ObjectMapper objectMapper;

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
     * 获取家庭的购买记录历史
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 按购买日期降序排列的购买记录列表
     */
    public List<PurchaseRecordDTO> getPurchaseHistory(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<PurchaseRecord> records = purchaseRecordRepository.findByFamilyIdOrderByPurchaseDateDesc(familyId);
        return records.stream().map(record -> {
            PurchaseRecordDTO dto = PurchaseRecordDTO.fromEntity(record);
            userRepository.findById(record.getPurchaserId())
                    .ifPresent(u -> dto.setPurchaserNickname(u.getNickname()));
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 获取指定购买记录的详细信息
     * @param familyId 家庭ID
     * @param purchaseId 购买记录ID
     * @param user 当前用户
     * @return 购买记录详细信息；记录不存在时抛出异常
     */
    public PurchaseRecordDTO getPurchaseById(Long familyId, Long purchaseId, User user) {
        validateFamilyAccess(familyId, user);
        PurchaseRecord record = purchaseRecordRepository.findById(purchaseId)
                .orElseThrow(() -> new BusinessException("购买记录不存在"));
        PurchaseRecordDTO dto = PurchaseRecordDTO.fromEntity(record);
        userRepository.findById(record.getPurchaserId())
                .ifPresent(u -> dto.setPurchaserNickname(u.getNickname()));
        return dto;
    }

    /**
     * 创建购买记录并更新物品库存
     * @param familyId 家庭ID
     * @param user 当前用户（购买者）
     * @param request 创建请求，包含购买日期、购买物品列表和备注
     * @return 创建的购买记录信息；自动计算总金额并更新相关物品的库存数量
     */
    @Transactional
    public PurchaseRecordDTO createPurchase(Long familyId, User user, CreatePurchaseRequest request) {
        validateFamilyAccess(familyId, user);

        PurchaseRecord record = new PurchaseRecord();
        record.setFamilyId(familyId);
        record.setPurchaserId(user.getId());
        record.setPurchaseDate(request.getPurchaseDate());
        record.setNotes(request.getNotes());

        // 计算总金额
        double totalAmount = request.getItems().stream()
                .filter(item -> item.getPrice() != null)
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        record.setTotalAmount(totalAmount);

        // 转换为 JSON
        try {
            record.setItemsJson(objectMapper.writeValueAsString(request.getItems()));
        } catch (JsonProcessingException e) {
            throw new BusinessException("保存购买物品失败");
        }

        // 更新物品库存
        for (CreatePurchaseRequest.PurchaseItem purchaseItem : request.getItems()) {
            if (purchaseItem.getItemId() != null) {
                itemRepository.findByIdAndFamilyIdAndIsDeletedFalse(purchaseItem.getItemId(), familyId)
                        .ifPresent(item -> {
                            item.setQuantity(item.getQuantity() + purchaseItem.getQuantity());
                            if (item.getQuantity() >= item.getMinQuantity()) {
                                item.setUsedUp(false);
                                item.setIsAlert(false);
                            }
                            itemRepository.save(item);
                        });
            }
        }

        record = purchaseRecordRepository.save(record);

        PurchaseRecordDTO dto = PurchaseRecordDTO.fromEntity(record);
        dto.setPurchaserNickname(user.getNickname());
        return dto;
    }

    /**
     * 删除购买记录
     * @param familyId 家庭ID
     * @param purchaseId 购买记录ID
     * @param user 当前用户
     * @throws BusinessException 记录不存在时抛出异常
     */
    @Transactional
    public void deletePurchase(Long familyId, Long purchaseId, User user) {
        validateFamilyAccess(familyId, user);
        PurchaseRecord record = purchaseRecordRepository.findById(purchaseId)
                .orElseThrow(() -> new BusinessException("购买记录不存在"));
        purchaseRecordRepository.delete(record);
    }
}
