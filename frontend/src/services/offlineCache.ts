import { localDb, db, LocalItem } from '../db';
import type { Item, Family } from '../types';

/**
 * 离线缓存服务
 * 将API数据缓存到IndexedDB，支持离线访问
 */
export const offlineCache = {
  /**
   * 缓存物品列表
   */
  async cacheItems(familyId: number, items: Item[]): Promise<void> {
    const localItems: LocalItem[] = items.map((item) => ({
      serverId: item.id,
      familyId: item.familyId,
      creatorId: item.creatorId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      locationId: item.locationId,
      locationPath: item.locationPath,
      category: item.category,
      coverImageUrl: item.coverImageUrl,
      customFields: item.customFields,
      isAlert: item.isAlert,
      isDeleted: item.isDeleted ?? false,
      updatedAt: item.updatedAt,
      syncStatus: 'synced',
    }));

    // 清除旧数据
    await db.items.where('familyId').equals(familyId).delete();

    // 保存新数据
    for (const item of localItems) {
      await localDb.saveItem(item);
    }
  },

  /**
   * 从缓存获取物品列表
   */
  async getCachedItems(familyId: number): Promise<LocalItem[]> {
    return await localDb.getItemsByFamily(familyId);
  },

  /**
   * 搜索缓存的物品
   */
  async searchCachedItems(familyId: number, keyword: string): Promise<LocalItem[]> {
    return await localDb.searchItems(familyId, keyword);
  },

  /**
   * 更新单个缓存物品
   */
  async updateCachedItem(familyId: number, itemId: number, updates: Partial<Item>): Promise<void> {
    const items = await localDb.getItemsByFamily(familyId);
    const item = items.find((i) => i.serverId === itemId);
    if (item && item.id) {
      await localDb.saveItem({
        ...item,
        ...updates,
        syncStatus: 'pending',
      } as LocalItem);
    }
  },

  /**
   * 删除缓存物品（软删除）
   */
  async deleteCachedItem(familyId: number, itemId: number): Promise<void> {
    const items = await localDb.getItemsByFamily(familyId);
    const item = items.find((i) => i.serverId === itemId);
    if (item && item.id) {
      await localDb.saveItem({
        ...item,
        isDeleted: true,
        syncStatus: 'pending',
      } as LocalItem);
    }
  },

  /**
   * 缓存家庭数据
   */
  async cacheFamilies(families: Family[]): Promise<void> {
    // 家庭数据较小，直接存储整个列表
    localStorage.setItem('cached_families', JSON.stringify(families));
  },

  /**
   * 获取缓存的家庭数据
   */
  getCachedFamilies(): Family[] | null {
    const cached = localStorage.getItem('cached_families');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    await db.items.clear();
    localStorage.removeItem('cached_families');
  },
};