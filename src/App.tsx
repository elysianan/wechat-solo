import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';
import { useContactStore } from './stores/useContactStore';
import { useChatStore } from './stores/useChatStore';
import { useEffect } from 'react';

const tabPages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const currentPage = useAppStore((state) => state.currentPage);
  const TabPage = tabPages[currentTab];

  // 应用启动时从 IndexedDB 加载联系人和会话数据
  const loadContacts = useContactStore((state) => state.loadContacts);
  const loadChats = useChatStore((state) => state.loadChats);
  const contactsLoaded = useContactStore((state) => state.loaded);
  const chatsLoaded = useChatStore((state) => state.loaded);

  useEffect(() => {
    if (!contactsLoaded) {
      loadContacts();
    }
    if (!chatsLoaded) {
      loadChats();
    }
  }, [contactsLoaded, loadContacts, chatsLoaded, loadChats]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <div className="relative mx-auto max-w-phone h-full overflow-hidden bg-wechat-bg shadow-xl">
        {/* Tab 页面层，进入详情时整体向左滑出 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            currentPage === 'chat-detail' ? '-translate-x-full' : 'translate-x-0'
          }`}
          data-testid="tab-layer"
        >
          <TabPage />
          <TabBar />
        </div>

        {/* 聊天详情页，从右侧滑入 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            currentPage === 'chat-detail' ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid="detail-layer"
        >
          <ChatDetailPage />
        </div>
      </div>
    </div>
  );
}

export default App;
