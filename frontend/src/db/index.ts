import Dexie, { Table } from 'dexie';

export interface LocalItem {
  id?: number;
  serverId?: number;
  familyId: number;
  creatorId: number;
  name: string;
  description?: string;
  quantity: number;
  minQuantity: number;
  locationId?: number;
  locationPath?: string;
  category?: string;
  coverImageUrl?: string;
  customFields?: string;
  isAlert: boolean;
  isDeleted: boolean;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface SyncQueueItem {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: 'item' | 'location' | 'family' | 'purchase';
  entityId?: number;
  data: any;
  timestamp: string;
  retryCount: number;
}

export class HomeKeepDB extends Dexie {
  items!: Table<LocalItem, number>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('HomeKeepDB');
    this.version(1).stores({
      items: '++id, serverId, familyId, name, locationId, category, isDeleted, syncStatus',
      syncQueue: '++id, type, entity, timestamp',
    });
  }
}

export const db = new HomeKeepDB();

export const localDb = {
  async saveItem(item: Partial<LocalItem>): Promise<number> {
    return await db.items.put(item as LocalItem);
  },

  async getItemsByFamily(familyId: number): Promise<LocalItem[]> {
    return await db.items
      .where('familyId')
      .equals(familyId)
      .and(item => !item.isDeleted)
      .toArray();
  },

  async searchItems(familyId: number, keyword: string): Promise<LocalItem[]> {
    const lowerKeyword = keyword.toLowerCase();
    return await db.items
      .where('familyId')
      .equals(familyId)
      .and((item): boolean => Boolean(
        item.isDeleted !== true &&
        (item.name.toLowerCase().includes(lowerKeyword) ||
          item.description?.toLowerCase().includes(lowerKeyword) ||
          item.category?.toLowerCase().includes(lowerKeyword))
      ))
      .toArray();
  },

  async addToSyncQueue(entry: Omit<SyncQueueItem, 'id'>): Promise<number> {
    return await db.syncQueue.put(entry as SyncQueueItem);
  },

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.toArray();
  },

  async removeSyncItem(id: number): Promise<void> {
    await db.syncQueue.delete(id);
  },

  async clearSyncQueue(): Promise<void> {
    await db.syncQueue.clear();
  },
};
