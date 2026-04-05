import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi, locationApi } from '../services/item';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import Combobox from '../components/Combobox';
import Modal from '../components/Modal';
import type { Item } from '../types';

const PREDEFINED_CATEGORIES = ['厨房', '洗漱', '食品', '日用', '药品', '护肤', '其他'];

export default function ItemEditPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentFamilyId } = useAuthStore();
  const isEditing = !!itemId && itemId !== 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState<number | null>(null);
  // 用于临时显示输入值（允许为空）
  const [quantityInput, setQuantityInput] = useState('1');
  const [minQuantityInput, setMinQuantityInput] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  // 位置状态 - 支持层级结构
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocationPath, setSelectedLocationPath] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [customFields, setCustomFields] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [uploadingImage, setUploadingImage] = useState(false);
  // 新建位置弹窗
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationParentId, setNewLocationParentId] = useState<number | null>(null);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['item', currentFamilyId, itemId],
    queryFn: () => itemApi.getById(currentFamilyId!, Number(itemId)),
    enabled: !!currentFamilyId && isEditing,
  });

  // 获取顶层位置
  const { data: rootLocations = [] } = useQuery({
    queryKey: ['locations', 'root', currentFamilyId],
    queryFn: () => locationApi.getRoot(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  // 获取选中位置的子位置
  const { data: childLocations = [] } = useQuery({
    queryKey: ['locations', 'children', currentFamilyId, selectedLocationId],
    queryFn: () => locationApi.getChildren(currentFamilyId!, selectedLocationId!),
    enabled: !!currentFamilyId && !!selectedLocationId,
  });

  // 创建位置 mutation
  const createLocationMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      locationApi.create(currentFamilyId!, data),
    onSuccess: (newLocation) => {
      // 刷新所有位置相关的查询
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      // 选择新创建的位置
      setSelectedLocationId(newLocation.id);
      setSelectedLocationPath(newLocation.path);
      setShowNewLocation(false);
      setNewLocationName('');
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
      setSelectedLocationPath(item.locationPath || '');
      setCoverImageUrl(item.coverImageUrl || '');
      setCustomFields(item.customFields || '');
      setExpiryDate(item.expiryDate || '');
      setExpiryDays(item.expiryDays || 7);
    }
  }, [item]);

  // 上传图片
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ success: boolean; data: string }>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.success) {
      // 返回完整URL
      return window.location.origin + response.data.data;
    }
    throw new Error('图片上传失败');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // 阻止表单默认提交
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
    return <div className="animate-pulse">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded text-lg">
          ←
        </button>
        <h2 className="text-lg sm:text-xl font-bold">{isEditing ? '编辑物品' : '添加物品'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3 sm:space-y-4">
        <div>
          <label className="label">物品名称 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-sm"
            placeholder="例如：洗发水"
            required
          />
        </div>

        <div>
          <label className="label">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input text-sm"
            rows={2}
            placeholder="物品描述（选填）"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="label">数量 *</label>
            <input
              type="number"
              value={quantityInput}
              onChange={(e) => {
                const val = e.target.value;
                setQuantityInput(val);
                if (val === '') {
                  setQuantity(1); // 临时值
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num > 0) {
                    setQuantity(num);
                  }
                }
              }}
              onBlur={(e) => {
                // 失焦时确保有效值
                const val = parseInt(e.target.value) || 1;
                setQuantity(val);
                setQuantityInput(String(val));
              }}
              className="input text-sm"
              min={1}
              required
            />
          </div>
          <div>
            <label className="label">最低数量</label>
            <input
              type="number"
              value={minQuantityInput}
              onChange={(e) => {
                const val = e.target.value;
                setMinQuantityInput(val);
                if (val === '') {
                  setMinQuantity(null);
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 0) {
                    setMinQuantity(num);
                  }
                }
              }}
              onBlur={(e) => {
                // 失焦时处理空值
                const val = e.target.value;
                if (val === '') {
                  setMinQuantity(null);
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 0) {
                    setMinQuantity(num);
                    setMinQuantityInput(String(num));
                  }
                }
              }}
              className="input text-sm"
              min={0}
              placeholder="留空表示不监控"
            />
          </div>
        </div>

        <div>
          <label className="label">分类</label>
          <Combobox
            value={category}
            onChange={setCategory}
            options={PREDEFINED_CATEGORIES}
            placeholder="选择或输入分类"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="label">存放位置</label>
            <div className="space-y-2">
              {/* 已选位置显示 */}
              {selectedLocationPath && (
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                  <span>{selectedLocationPath}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(null);
                      setSelectedLocationPath('');
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 位置选择下拉 */}
              {!selectedLocationPath && (
                <select
                  className="input text-sm"
                  value={selectedLocationId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new__') {
                      setNewLocationParentId(null);
                      setNewLocationName('');
                      setShowNewLocation(true);
                      return;
                    }
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
                  <option value="__new__">+ 新建位置</option>
                </select>
              )}

              {/* 子位置选择 */}
              {!selectedLocationPath && selectedLocationId && childLocations.length > 0 && (
                <select
                  className="input text-sm"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new_child__') {
                      setNewLocationParentId(selectedLocationId);
                      setNewLocationName('');
                      setShowNewLocation(true);
                      return;
                    }
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
                  <option value="__new_child__">+ 在此位置下新建</option>
                </select>
              )}

              {/* 新建位置入口 */}
              {!selectedLocationPath && (
                <button
                  type="button"
                  onClick={() => {
                    setNewLocationParentId(null);
                    setNewLocationName('');
                    setShowNewLocation(true);
                  }}
                  className="text-sm text-primary hover:text-primary-600"
                >
                  + 新建顶层位置
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label">标签</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input text-sm"
              placeholder="多个标签用逗号分隔"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="label">有效期至</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="label">提前提醒(天)</label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
              className="input text-sm"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="label">物品图片</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {coverImageUrl ? (
              <div className="relative w-full max-w-[200px]">
                <img
                  src={coverImageUrl}
                  alt="物品图片"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-[200px] h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                {uploadingImage ? (
                  <span className="text-gray-400 text-sm">上传中...</span>
                ) : (
                  <>
                    <span className="text-3xl text-gray-400">📷</span>
                    <span className="text-xs text-gray-400 mt-1">点击选择图片</span>
                  </>
                )}
              </div>
            )}
            <span className="text-xs text-gray-400">支持拍照上传（手机）或选择本地图片</span>
          </div>
        </div>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-red-500 text-xs sm:text-sm">
            {((createMutation.error || updateMutation.error) as any).response?.data?.message || '操作失败'}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1 text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 text-sm"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? '保存中...' : '保存'}
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
                createLocationMutation.mutate({
                  name: newLocationName.trim(),
                  parentId: newLocationParentId || undefined,
                });
              }
            }}
            className="space-y-4"
          >
            {newLocationParentId && (
              <p className="text-sm text-gray-500">
                将创建在: {rootLocations.find(l => l.id === newLocationParentId)?.name} 下
              </p>
            )}
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
              <p className="text-red-500 text-sm">
                {(createLocationMutation.error as any).response?.data?.message || '创建失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewLocation(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
