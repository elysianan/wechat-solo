import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore, selectTagCounts } from '../stores/useContactStore';

// 标签列表页：标签 + 成员计数，支持新建标签
export function TagListPage() {
  const popPage = useAppStore((state) => state.popPage);
  const navigateToTagDetail = useAppStore((state) => state.navigateToTagDetail);
  const tags = useContactStore((state) => state.tags);
  const contacts = useContactStore((state) => state.contacts);
  const loadTags = useContactStore((state) => state.loadTags);
  const createTag = useContactStore((state) => state.createTag);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (tags.length === 0) loadTags();
  }, [tags.length, loadTags]);

  const counts = selectTagCounts(tags, contacts);

  const handleCreate = async () => {
    const ok = await createTag(newName);
    if (ok) {
      setNewName('');
      setCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="tag-list-page">
      <Header title="标签" onBack={popPage} />

      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        {counts.map((item) => (
          <button
            key={item.name}
            onClick={() => navigateToTagDetail(item.name)}
            className="w-full flex items-center px-4 py-3 active:bg-wechat-bg active:scale-[0.98] transition-transform duration-100"
            data-testid={`tag-row-${item.name}`}
          >
            <span className="text-base text-wechat-text-primary flex-1 text-left">{item.name}</span>
            <span className="text-sm text-wechat-text-secondary" data-testid={`tag-count-${item.name}`}>
              {item.count} 个联系人
            </span>
            <span className="text-wechat-text-secondary text-sm ml-1">›</span>
          </button>
        ))}
      </div>

      {/* 新建标签：按钮 → 行内输入 */}
      <div className="mt-2 bg-wechat-card px-4 py-3">
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入标签名称"
              className="flex-1 bg-wechat-bg rounded-md px-3 py-2 text-sm outline-none text-wechat-text-primary"
              data-testid="tag-create-input"
            />
            <button
              onClick={handleCreate}
              className="text-sm text-wechat-green font-medium px-2"
              data-testid="tag-create-confirm"
            >
              完成
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewName('');
              }}
              className="text-sm text-wechat-text-secondary px-2"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full text-center text-wechat-green text-base"
            data-testid="tag-create-button"
          >
            + 新建标签
          </button>
        )}
      </div>
    </div>
  );
}
