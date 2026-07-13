import { useState } from 'react';
import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';

// 标签详情页：成员管理（增删）、重命名、删除标签
export function TagDetailPage() {
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const navigateToTagDetail = useAppStore((state) => state.navigateToTagDetail);

  const topRoute = pageStack[pageStack.length - 1];
  const tag = topRoute?.type === 'tag-detail' ? topRoute.tag : null;

  const contacts = useContactStore((state) => state.contacts);
  const setContactTags = useContactStore((state) => state.setContactTags);
  const renameTag = useContactStore((state) => state.renameTag);
  const deleteTag = useContactStore((state) => state.deleteTag);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  if (!tag) return null;

  const members = contacts.filter((c) => c.tags.includes(tag));
  const candidates = contacts.filter((c) => !c.tags.includes(tag));

  const handleRemove = async (contactId: string, currentTags: string[]) => {
    await setContactTags(contactId, currentTags.filter((t) => t !== tag));
  };

  const handleAdd = async (contactId: string, currentTags: string[]) => {
    await setContactTags(contactId, [...currentTags, tag]);
    setAddingMember(false);
  };

  const handleRename = async () => {
    const ok = await renameTag(tag, renameValue);
    if (ok) {
      setRenaming(false);
      setRenameValue('');
      // 路由中的标签名已过期：替换为新名字
      popPage();
      navigateToTagDetail(renameValue.trim());
    }
  };

  const handleDelete = async () => {
    await deleteTag(tag);
    popPage();
  };

  // 重命名模式
  if (renaming) {
    return (
      <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="tag-rename-page">
        <Header
          title="重命名标签"
          onBack={() => setRenaming(false)}
          right={
            <button
              onClick={handleRename}
              className="text-sm text-wechat-green font-medium"
              data-testid="tag-rename-confirm"
            >
              保存
            </button>
          }
        />
        <div className="mt-2 bg-wechat-card px-4 py-3">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full bg-transparent text-base text-wechat-text-primary outline-none"
            data-testid="tag-rename-input"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-wechat-bg" data-testid="tag-detail-page">
      <Header
        title={tag}
        onBack={popPage}
        right={
          <button
            onClick={() => {
              setRenameValue(tag);
              setRenaming(true);
            }}
            className="text-sm text-wechat-text-secondary"
            data-testid="tag-rename-button"
          >
            重命名
          </button>
        }
      />

      {/* 成员列表 */}
      <div className="mt-2 bg-wechat-card divide-y divide-wechat-divider">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center px-4 py-3"
            data-testid={`tag-member-${member.id}`}
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-md bg-wechat-bg object-cover"
            />
            <span className="ml-3 text-base text-wechat-text-primary flex-1">{member.name}</span>
            <button
              onClick={() => handleRemove(member.id, member.tags)}
              className="text-sm text-wechat-text-secondary"
              data-testid={`tag-member-remove-${member.id}`}
            >
              移除
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-wechat-text-secondary">
            暂无成员，点击下方按钮添加
          </div>
        )}
      </div>

      {/* 添加成员：按钮 → 候选列表 */}
      <div className="mt-2 bg-wechat-card">
        {!addingMember ? (
          <button
            onClick={() => setAddingMember(true)}
            className="w-full text-center text-wechat-green text-base py-3"
            data-testid="tag-add-member-button"
          >
            + 添加成员
          </button>
        ) : (
          <div className="divide-y divide-wechat-divider">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => handleAdd(candidate.id, candidate.tags)}
                className="w-full flex items-center px-4 py-3 active:bg-wechat-bg"
                data-testid={`tag-candidate-${candidate.id}`}
              >
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-10 h-10 rounded-md bg-wechat-bg object-cover"
                />
                <span className="ml-3 text-base text-wechat-text-primary">{candidate.name}</span>
              </button>
            ))}
            {candidates.length === 0 && (
              <div className="px-4 py-3 text-sm text-wechat-text-secondary">没有可添加的联系人</div>
            )}
          </div>
        )}
      </div>

      {/* 删除标签 */}
      <div className="mt-6 px-4">
        <button
          onClick={handleDelete}
          className="w-full bg-wechat-card text-red-500 text-base py-3 rounded-md"
          data-testid="tag-delete-button"
        >
          删除标签
        </button>
      </div>
    </div>
  );
}
