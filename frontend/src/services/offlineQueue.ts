import { localDb, SyncQueueItem } from '../db';
import { useOfflineStore } from '../stores/offlineStore';
import { itemApi } from './item';

export type MutationType = 'create' | 'update' | 'delete';
export type EntityType = 'item' | 'family' | 'purchase' | 'location';

/**
 * 离线队列服务
 * 处理离线期间的操作队列，网络恢复后自动同步
 */
export const offlineQueue = {
  /**
   * 添加操作到同步队列
   */
  async addToQueue(
    type: MutationType,
    entity: EntityType,
    entityId: number | undefined,
    data: any
  ): Promise<number> {
    const entry: Omit<SyncQueueItem, 'id'> = {
      type,
      entity,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const id = await localDb.addToSyncQueue(entry);
    useOfflineStore.getState().incrementPending();
    return id;
  },

  /**
   * 获取所有待同步的操作
   */
  async getPendingOperations(): Promise<SyncQueueItem[]> {
    return await localDb.getPendingSyncItems();
  },

  /**
   * 获取待同步操作的数量
   */
  async getPendingCount(): Promise<number> {
    const items = await localDb.getPendingSyncItems();
    return items.length;
  },

  /**
   * 移除已同步的操作
   */
  async removeOperation(id: number): Promise<void> {
    await localDb.removeSyncItem(id);
    useOfflineStore.getState().decrementPending();
  },

  /**
   * 清空同步队列
   */
  async clearQueue(): Promise<void> {
    await localDb.clearSyncQueue();
    useOfflineStore.getState().setPendingMutations(0);
  },

  /**
   * 同步所有待处理的操作
   * 网络恢复后调用此方法
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    const { isOnline } = useOfflineStore.getState();
    if (!isOnline) {
      console.warn('Cannot sync: currently offline');
      return { success: 0, failed: 0 };
    }

    const pending = await this.getPendingOperations();
    let success = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await this.syncOperation(item);
        if (item.id) await this.removeOperation(item.id);
        success++;
      } catch (error) {
        console.error('Failed to sync operation:', item, error);
        failed++;
        // 增加重试次数，如果超过3次则放弃
        if (item.retryCount >= 3 && item.id) {
          await this.removeOperation(item.id);
        }
      }
    }

    if (success > 0) {
      useOfflineStore.getState().setLastSyncTime(new Date().toISOString());
    }

    return { success, failed };
  },

  /**
   * 同步单个操作
   */
  async syncOperation(item: SyncQueueItem): Promise<void> {
    const { type, entity, entityId, data } = item;

    switch (entity) {
      case 'item':
        await this.syncItemOperation(type, entityId, data);
        break;
      case 'family':
        // 家庭操作通常不需要离线队列，因为需要邀请码等
        break;
      case 'purchase':
        // 采购记录暂不支持离线
        break;
      case 'location':
        // 位置操作暂不支持离线
        break;
      default:
        console.warn('Unknown entity type:', entity);
    }
  },

  /**
   * 同步物品操作
   */
  async syncItemOperation(
    type: MutationType,
    entityId: number | undefined,
    data: any
  ): Promise<void> {
    const { familyId } = data;

    switch (type) {
      case 'create':
        // 离线创建需要特殊处理，因为没有serverId
        if (entityId) {
          await itemApi.update(familyId, entityId, data);
        }
        break;
      case 'update':
        if (entityId) {
          await itemApi.update(familyId, entityId, data);
        }
        break;
      case 'delete':
        if (entityId) {
          await itemApi.delete(familyId, entityId);
        }
        break;
    }
  },
};

// 监听网络恢复事件，自动同步
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network restored, syncing offline queue...');
    setTimeout(() => {
      offlineQueue.syncAll();
    }, 1000); // 延迟1秒确保网络稳定
  });
}