import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi, locationApi, categoryApi } from '../services/item';
import { familyApi } from '../services/family';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import Modal from '../components/Modal';
import type { Item } from '../types';

export default function ItemEditPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentFamilyId, setCurrentFamilyId } = useAuthStore();
  const isEditing = !!itemId && itemId !== 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [minQuantityInput, setMinQuantityInput] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocationPath, setSelectedLocationPath] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [customFields, setCustomFields] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: families = [] } = useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getAll,
  });

  useEffect(() => {
    if (families.length > 0 && !currentFamilyId) {
      setCurrentFamilyId(families[0].id);
    }
  }, [families, currentFamilyId, setCurrentFamilyId]);

  // 当 currentFamilyId 变化时，清除相关缓存确保数据最新
  useEffect(() => {
    if (currentFamilyId) {
      queryClient.invalidateQueries({ queryKey: ['locations', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['categories', currentFamilyId] });
    }
  }, [currentFamilyId, queryClient]);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['item', currentFamilyId, itemId],
    queryFn: () => itemApi.getById(currentFamilyId!, Number(itemId)),
    enabled: !!currentFamilyId && isEditing,
  });

  const { data: rootLocations = [] } = useQuery({
    queryKey: ['locations', 'root', currentFamilyId],
    queryFn: () => locationApi.getRoot(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: childLocations = [] } = useQuery({
    queryKey: ['locations', 'children', currentFamilyId, selectedLocationId],
    queryFn: () => locationApi.getChildren(currentFamilyId!, selectedLocationId!),
    enabled: !!currentFamilyId && !!selectedLocationId,
  });

  const createLocationMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      locationApi.create(currentFamilyId!, data),
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setSelectedLocationId(newLocation.id);
      setSelectedLocationPath(newLocation.path);
      setShowNewLocation(false);
      setNewLocationName('');
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'all', currentFamilyId],
    queryFn: () => categoryApi.getAll(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      categoryApi.create(currentFamilyId!, data),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategory(newCategory.name);
      setShowNewCategory(false);
      setNewCategoryName('');
    },
  });

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setQuantity(item.quantity);
      setMinQuantity(item.minQuantity ?? null);
      setQuantityInput(String(item.quantity));
      setMinQuantityInput(item.minQuantity != null ? String(item.minQuantity) : '');
      setCategory(item.category || '');
      setTags(item.tags || '');
      setSelectedLocationId(item.locationId ?? null);
      setSelectedLocationPath(item.locationPath || '');
      setCoverImageUrl(item.coverImageUrl || '');
      setCustomFields(item.customFields || '');
      setExpiryDate(item.expiryDate || '');
      setExpiryDays(item.expiryDays || 7);
    }
  }, [item]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ success: boolean; data: string }>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.success) {
      return window.location.origin + response.data.data;
    }
    throw new Error('图片上传失败');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      alert('图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Item>) => itemApi.create(currentFamilyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      navigate('/items');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Item>) => itemApi.update(currentFamilyId!, Number(itemId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['item', currentFamilyId, itemId] });
      navigate(`/items/${itemId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Item> = {
      name,
      description: description || undefined,
      quantity,
      minQuantity: minQuantity ?? undefined,
      category: category || undefined,
      tags: tags || undefined,
      locationPath: selectedLocationPath || undefined,
      coverImageUrl: coverImageUrl || undefined,
      customFields: customFields || undefined,
      expiryDate: expiryDate || undefined,
      expiryDays: expiryDays || 7,
    };
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && itemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-warm)' }}>
            <svg className="w-8 h-8 animate-spin text-[#9C9690]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[#6B6560]">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 px-5 py-4" style={{ backgroundColor: 'rgba(250, 250, 248, 0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <svg className="w-5 h-5 text-[#6B6560]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[#2D2A26]">
            {isEditing ? '编辑物品' : '添加物品'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 mt-6 space-y-5">
        {/* 基本信息 */}
        <div className="card space-y-4">
          <div>
            <label className="label">物品名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="例如：洗发水"
              required
            />
          </div>

          <div>
            <label className="label">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="物品描述（选填）"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">数量 *</label>
              <input
                type="number"
                value={quantityInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantityInput(val);
                  if (val === '') { setQuantity(1); }
                  else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num > 0) { setQuantity(num); }
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(val);
                  setQuantityInput(String(val));
                }}
                className="input"
                min={1}
                required
              />
            </div>
            <div>
              <label className="label">最低库存</label>
              <input
                type="number"
                value={minQuantityInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setMinQuantityInput(val);
                  if (val === '') { setMinQuantity(null); }
                  else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 0) { setMinQuantity(num); }
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '') { setMinQuantity(null); }
                  else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 0) { setMinQuantity(num); setMinQuantityInput(String(num)); }
                  }
                }}
                className="input"
                min={0}
                placeholder="不提醒"
              />
            </div>
          </div>
        </div>

        {/* 分类与位置 */}
        <div className="card space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">分类</label>
              <button
                type="button"
                onClick={() => { setNewCategoryName(''); setShowNewCategory(true); }}
                className="text-xs text-[#D4662B] hover:text-[#B8531F] font-medium"
              >
                + 新建
              </button>
            </div>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">选择分类</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">存放位置</label>
              <button
                type="button"
                onClick={() => { setNewLocationName(''); setShowNewLocation(true); }}
                className="text-xs text-[#D4662B] hover:text-[#B8531F] font-medium"
              >
                + 新建
              </button>
            </div>
            <select
              className="input mb-2"
              value={selectedLocationId || ''}
              onChange={(e) => {
                const val = e.target.value;
                const id = val ? Number(val) : null;
                setSelectedLocationId(id);
                if (id) {
                  const loc = rootLocations.find(l => l.id === id);
                  setSelectedLocationPath(loc?.path || loc?.name || '');
                } else {
                  setSelectedLocationPath('');
                }
              }}
            >
              <option value="">选择位置</option>
              {rootLocations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>

            {selectedLocationId && childLocations.length > 0 && (
              <select
                className="input"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  const id = val ? Number(val) : null;
                  if (id) {
                    const loc = childLocations.find(l => l.id === id);
                    if (loc) {
                      setSelectedLocationId(loc.id);
                      setSelectedLocationPath(loc.path);
                    }
                  }
                }}
              >
                <option value="">选择子位置</option>
                {childLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            )}

            {selectedLocationPath && (
              <div className="mt-2 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-warm)', color: 'var(--color-text-secondary)' }}>
                当前位置：{selectedLocationPath}
              </div>
            )}
          </div>

          <div>
            <label className="label">标签</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="多个标签用逗号分隔"
            />
          </div>
        </div>

        {/* 有效期 */}
        <div className="card">
          <label className="label mb-3">有效期设置</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6B6560] mb-1 block">有效期至</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B6560] mb-1 block">提前提醒</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                  className="input"
                  min={1}
                />
                <span className="text-sm text-[#6B6560]">天</span>
              </div>
            </div>
          </div>
        </div>

        {/* 图片上传 */}
        <div className="card">
          <label className="label">物品图片</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {coverImageUrl ? (
            <div className="relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-warm)' }}>
                <img src={coverImageUrl} alt="物品图片" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 btn-ghost text-sm py-2"
                >
                  更换图片
                </button>
                <button
                  type="button"
                  onClick={() => { setCoverImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="btn-ghost text-sm py-2 px-4 text-[#C74D3D]"
                >
                  删除
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {uploadingImage ? (
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto animate-spin text-[#9C9690]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm text-[#6B6560] mt-2">上传中...</p>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-[#9C9690]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-sm text-[#6B6560] mt-3">点击上传图片</p>
                  <p className="text-xs text-[#9C9690] mt-1">支持拍照或选择本地图片</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {(createMutation.error || updateMutation.error) && (
          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--color-danger-light)' }}>
            <svg className="w-5 h-5 text-[#C74D3D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
            <p className="text-sm text-[#C74D3D]">
              {((createMutation.error || updateMutation.error) as any).response?.data?.message || '操作失败'}
            </p>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 btn-ghost py-3"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary py-3"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? '保存中...' : (isEditing ? '保存修改' : '添加物品')}
          </button>
        </div>
      </form>

      {/* 新建位置弹窗 */}
      {showNewLocation && (
        <Modal title="新建位置" onClose={() => setShowNewLocation(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newLocationName.trim()) {
                createLocationMutation.mutate({ name: newLocationName.trim() });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">位置名称</label>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="input"
                placeholder="例如：客厅"
                autoFocus
                required
              />
            </div>
            {createLocationMutation.error && (
              <p className="text-sm text-[#C74D3D]">{(createLocationMutation.error as any).response?.data?.message || '创建失败'}</p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNewLocation(false)} className="flex-1 btn-ghost py-2.5">
                取消
              </button>
              <button type="submit" className="flex-1 btn-primary py-2.5" disabled={createLocationMutation.isPending}>
                {createLocationMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 新建分类弹窗 */}
      {showNewCategory && (
        <Modal title="新建分类" onClose={() => setShowNewCategory(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newCategoryName.trim()) {
                createCategoryMutation.mutate({ name: newCategoryName.trim() });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">分类名称</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="input"
                placeholder="例如：厨房"
                autoFocus
                required
              />
            </div>
            {createCategoryMutation.error && (
              <p className="text-sm text-[#C74D3D]">{(createCategoryMutation.error as any).response?.data?.message || '创建失败'}</p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNewCategory(false)} className="flex-1 btn-ghost py-2.5">
                取消
              </button>
              <button type="submit" className="flex-1 btn-primary py-2.5" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}