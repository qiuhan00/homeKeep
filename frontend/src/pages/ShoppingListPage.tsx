import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../services/item';
import { familyApi } from '../services/family';
import { useAuthStore } from '../stores/auth';
import { usePermission } from '../hooks/usePermission';
import type { Item } from '../types';

interface ShoppingItem extends Item {
  needs: number; // 需要补充的数量
}

interface LocalShoppingItem extends ShoppingItem {
  needsInput: string; // 本地输入的需要数量
}

export default function ShoppingListPage() {
  const { currentFamilyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [needsInputs, setNeedsInputs] = useState<Record<number, string>>({});
  const [toast, setToast] = useState('');

  // 获取家庭列表用于权限检查
  const { data: families = [] } = useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getAll,
  });

  const currentFamily = families.find(f => f.id === currentFamilyId);
  const { canEdit } = usePermission(currentFamily);

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['lowStock', currentFamilyId],
    queryFn: () => itemApi.getLowStock(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  // 计算需要购买的数量
  const shoppingItems: LocalShoppingItem[] = lowStockItems.map(item => {
    let needs = 0;
    if (item.usedUp) {
      needs = item.minQuantity;
    } else {
      needs = Math.max(0, item.minQuantity - item.quantity);
    }
    return {
      ...item,
      needs,
      needsInput: needsInputs[item.id] !== undefined ? needsInputs[item.id] : String(needs),
    };
  });

  // 按分类分组
  const groupedByCategory = shoppingItems.reduce((acc, item) => {
    const category = item.category || '未分类';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, LocalShoppingItem[]>);

  // 调整数量
  const adjustMutation = useMutation({
    mutationFn: ({ itemId, delta }: { itemId: number; delta: number }) =>
      itemApi.adjustQuantity(currentFamilyId!, itemId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
    },
  });

  const toggleItem = (itemId: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const toggleAllInCategory = (category: string) => {
    const categoryItems = groupedByCategory[category];
    const allChecked = categoryItems.every(item => checkedItems.has(item.id));

    const newChecked = new Set(checkedItems);
    if (allChecked) {
      categoryItems.forEach(item => newChecked.delete(item.id));
    } else {
      categoryItems.forEach(item => newChecked.add(item.id));
    }
    setCheckedItems(newChecked);
  };

  // 生成分享文本
  const generateShareText = () => {
    let text = '🛒 购物清单\n\n';
    Object.entries(groupedByCategory).forEach(([category, items]) => {
      text += `【${category}】\n`;
      items.forEach(item => {
        const checked = checkedItems.has(item.id) ? '✓' : '□';
        text += `${checked} ${item.name} x${item.needs}\n`;
      });
      text += '\n';
    });
    return text;
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('复制失败');
    }
  };

  if (shoppingItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-lg font-bold mb-2">太棒了！</h2>
        <p className="text-gray-500 mb-6">所有物品都已充足，暂不需要采购</p>
        <Link to="/items/new" className="btn-primary">
          + 添加新物品
        </Link>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded text-lg">
          ←
        </Link>
        <h2 className="text-lg sm:text-xl font-bold">购物清单</h2>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            共 {shoppingItems.length} 件物品，已选 {checkedItems.size} 件
          </span>
          <div className="flex gap-2">
            {checkedItems.size > 0 && canEdit && (() => {
              const selectedItems = shoppingItems.filter(i => checkedItems.has(i.id));
              const hasValidNeeds = selectedItems.some(item => (parseInt(item.needsInput) || 0) > 0);
              return (
                <button
                  onClick={async () => {
                    if (!hasValidNeeds) {
                      setToast('所有选中物品的购买数量都为0');
                      setTimeout(() => setToast(''), 2000);
                      return;
                    }
                    for (const itemId of checkedItems) {
                      const item = shoppingItems.find(i => i.id === itemId);
                      if (item) {
                        const needs = parseInt(item.needsInput) || 0;
                        if (needs > 0) {
                          await itemApi.adjustQuantity(currentFamilyId!, itemId, needs);
                        }
                      }
                    }
                    queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
                    queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
                    setCheckedItems(new Set());
                  }}
                  disabled={adjustMutation.isPending}
                  className="btn-primary text-xs py-1 px-3"
                >
                  批量已购 ({checkedItems.size})
                </button>
              );
            })()}
            <button
              onClick={copyToClipboard}
              className="btn-secondary text-xs py-1 px-3"
            >
              {copied ? '已复制 ✓' : '复制清单'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          点击分类名称可全选/取消全选，点击物品可选中，批量已购将所有选中物品一次购齐
        </p>
      </div>

      {Object.entries(groupedByCategory).map(([category, items]) => {
        const allChecked = items.every(item => checkedItems.has(item.id));
        const someChecked = items.some(item => checkedItems.has(item.id));

        return (
          <div key={category} className="card mb-3">
            <div
              className="flex items-center gap-2 mb-3 cursor-pointer"
              onClick={() => toggleAllInCategory(category)}
            >
              <span className={`text-lg ${allChecked ? 'text-green-500' : someChecked ? 'text-orange-400' : 'text-gray-300'}`}>
                {allChecked ? '✓' : someChecked ? '◐' : '○'}
              </span>
              <h3 className="font-medium text-sm sm:text-base">{category}</h3>
              <span className="text-xs text-gray-400">({items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((item) => {
                const isChecked = checkedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded transition-colors ${
                      isChecked ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <span className={`text-sm ${isChecked ? 'text-green-500' : 'text-gray-300'}`}>
                        {isChecked ? '✓' : '○'}
                      </span>
                      <span className={`text-sm truncate ${isChecked ? 'line-through text-gray-400' : ''}`}>
                        {item.name}
                      </span>
                      {item.tags && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {item.tags.split(',').slice(0, 2).join(',')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const current = parseInt(item.needsInput) || 0;
                          const newVal = Math.max(0, current - 1);
                          setNeedsInputs(prev => ({ ...prev, [item.id]: String(newVal) }));
                        }}
                        disabled={!canEdit || adjustMutation.isPending}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.needsInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNeedsInputs(prev => ({ ...prev, [item.id]: val }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 h-6 text-center text-sm border border-gray-200 rounded"
                        min={0}
                        disabled={!canEdit}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const current = parseInt(item.needsInput) || 0;
                          const newVal = current + 1;
                          setNeedsInputs(prev => ({ ...prev, [item.id]: String(newVal) }));
                        }}
                        disabled={!canEdit || adjustMutation.isPending}
                        className="w-6 h-6 rounded-full bg-primary hover:bg-primary-600 text-white disabled:opacity-50 text-sm font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const needs = parseInt(item.needsInput) || 0;
                            if (needs <= 0) {
                              setToast('购买数量不能为0');
                              setTimeout(() => setToast(''), 2000);
                              return;
                            }
                            adjustMutation.mutate({ itemId: item.id, delta: needs });
                            setCheckedItems(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(item.id);
                              return newSet;
                            });
                          }}
                          disabled={adjustMutation.isPending}
                          className="btn-primary text-xs py-1 px-2 ml-1"
                        >
                          已购
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}