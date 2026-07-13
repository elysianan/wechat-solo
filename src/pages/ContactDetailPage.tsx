import { Header } from '../components/common/Header';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import { useChatStore } from '../stores/useChatStore';

// 好友资料页：只读展示联系人信息，并支持一键跳转聊天
export function ContactDetailPage() {
  // 页面栈操作
  const pageStack = useAppStore((state) => state.pageStack);
  const popPage = useAppStore((state) => state.popPage);
  const pushPage = useAppStore((state) => state.pushPage);

  // 本页面只在栈顶为 contact-detail 时渲染，直接读取栈顶路由
  const topRoute = pageStack[pageStack.length - 1];
  const contactId = topRoute?.type === 'contact-detail' ? topRoute.contactId : null;

  // 根据 contactId 查找对应联系人与会话
  const contact = useContactStore((state) =>
    state.contacts.find((c) => c.id === contactId)
  );
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.contactId === contactId)
  );

  // 未找到联系人时不渲染页面
  if (!contact) return null;

  // 点击发消息：先关闭资料页，再打开对应聊天页，保证返回直接回到通讯录
  const handleSendMessage = () => {
    if (!conversation) return;
    popPage();
    pushPage({ type: 'chat-detail', conversationId: conversation.id });
  };

  return (
    <div className="min-h-screen bg-wechat-bg flex flex-col" data-testid="contact-detail-page">
      <Header title="详细资料" onBack={popPage} />
      <div className="flex-1">
        {/* 头像与基础信息 */}
        <div className="bg-wechat-card mt-2 px-4 py-4 flex items-center">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-16 h-16 rounded-md bg-gray-200 object-cover"
          />
          <div className="ml-4 flex-1">
            <div className="text-lg font-medium text-wechat-text-primary">{contact.name}</div>
            <div className="text-sm text-wechat-text-secondary mt-1">微信号：{contact.wechatId}</div>
          </div>
        </div>

        {/* 地区、个性签名、标签 */}
        <div className="bg-wechat-card mt-2 divide-y divide-wechat-divider">
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">地区</span>
            <span className="text-sm text-wechat-text-primary flex-1">{contact.region}</span>
          </div>
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">个性签名</span>
            <span className="text-sm text-wechat-text-primary flex-1">{contact.signature}</span>
          </div>
          <div className="px-4 py-3 flex">
            <span className="text-sm text-wechat-text-secondary w-20">标签</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {contact.tags.length > 0 ? (
                contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-wechat-bg text-wechat-text-secondary rounded"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-wechat-text-secondary">无标签</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部发消息按钮 */}
      <div className="p-4 bg-wechat-card border-t border-wechat-divider">
        <button
          onClick={handleSendMessage}
          className="w-full bg-wechat-green text-white py-2 rounded-md"
          data-testid="contact-send-message"
        >
          发消息
        </button>
      </div>
    </div>
  );
}
