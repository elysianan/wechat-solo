import { useState } from 'react';
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import type { Me } from '../types';

// 可编辑字段定义
type EditableField = 'nickname' | 'wechatId' | 'region' | 'signature';

const fieldLabels: Record<EditableField, string> = {
  nickname: '昵称',
  wechatId: '微信号',
  region: '地区',
  signature: '个性签名',
};

// 个人信息编辑页：列表展示，点击单项进入编辑模式
export function ProfileEditPage() {
  const me = useContactStore((state) => state.me);
  const updateMe = useContactStore((state) => state.updateMe);
  const popPage = useAppStore((state) => state.popPage);

  const [editing, setEditing] = useState<{ field: EditableField; value: string } | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (value) {
      await updateMe({ [editing.field]: value } as Partial<Me>);
    }
    setEditing(null);
  };

  // 编辑模式：单字段输入页
  if (editing) {
    return (
      <div className="min-h-screen bg-wechat-bg" data-testid="profile-edit-field">
        <Header
          title={fieldLabels[editing.field]}
          onBack={() => setEditing(null)}
          right={
            <button
              onClick={handleSave}
              className="text-sm text-wechat-green font-medium"
              data-testid="profile-edit-save"
            >
              保存
            </button>
          }
        />
        <div className="mt-2 bg-wechat-card px-4 py-3">
          <input
            autoFocus
            value={editing.value}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            className="w-full bg-transparent text-base text-wechat-text-primary outline-none"
            data-testid="profile-edit-input"
          />
        </div>
      </div>
    );
  }

  // 列表模式
  return (
    <div className="min-h-screen bg-wechat-bg" data-testid="profile-edit-page">
      <Header title="个人信息" onBack={popPage} />

      {/* 头像：只读 */}
      <div className="bg-wechat-card flex items-center px-4 py-3 border-b border-wechat-divider">
        <span className="text-base text-wechat-text-primary flex-1">头像</span>
        <img
          src={me?.avatar}
          alt="头像"
          className="w-14 h-14 rounded-md object-cover bg-wechat-bg"
        />
      </div>

      {/* 可编辑字段 */}
      <div className="bg-wechat-card divide-y divide-wechat-divider">
        {(Object.keys(fieldLabels) as EditableField[]).map((field) => (
          <button
            key={field}
            onClick={() => setEditing({ field, value: me?.[field] ?? '' })}
            className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
            data-testid={`profile-field-${field}`}
          >
            <span className="text-base text-wechat-text-primary flex-1 text-left">
              {fieldLabels[field]}
            </span>
            <span className="text-sm text-wechat-text-secondary truncate max-w-[60%]">
              {me?.[field] ?? ''}
            </span>
            <span className="text-wechat-text-secondary text-sm ml-1">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
