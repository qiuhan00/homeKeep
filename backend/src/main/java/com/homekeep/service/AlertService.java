package com.homekeep.service;

import com.homekeep.entity.Family;
import com.homekeep.entity.FamilyMember;
import com.homekeep.entity.Item;
import com.homekeep.entity.PushSubscription;
import com.homekeep.entity.User;
import com.homekeep.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final ItemRepository itemRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    /**
     * 每日低库存检查定时任务
     * 每天早上9点执行，检查所有家庭的库存情况并发送提醒
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void dailyLowStockCheck() {
        log.info("Starting daily low stock check");

        List<Family> families = familyRepository.findAll();
        for (Family family : families) {
            List<Item> lowStockItems = itemRepository.findLowStockItems(family.getId());
            if (!lowStockItems.isEmpty()) {
                sendAlertToFamilyMembers(family, lowStockItems);
            }
        }
    }

    /**
     * 向家庭所有成员发送库存告警
     * @param family 家庭实体
     * @param items 库存不足的物品列表
     */
    private void sendAlertToFamilyMembers(Family family, List<Item> items) {
        List<FamilyMember> members = familyMemberRepository.findByFamilyId(family.getId());
        for (FamilyMember member : members) {
            List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserId(member.getUserId());
            for (PushSubscription subscription : subscriptions) {
                sendWebPush(subscription, family.getName(), items);
            }
        }
    }

    private void sendWebPush(PushSubscription subscription, String familyName, List<Item> items) {
        log.info("Sending push notification to endpoint: {}", subscription.getEndpoint());
    }

    /**
     * 获取指定家庭的告警物品列表
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 处于告警状态的物品列表
     */
    public List<Item> getAlertItems(Long familyId, User user) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new RuntimeException("您不是该家庭的成员");
        }
        return itemRepository.findByFamilyIdAndIsAlertTrueAndIsDeletedFalse(familyId);
    }
}
