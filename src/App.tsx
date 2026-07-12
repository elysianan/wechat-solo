import { useEffect } from 'react';
import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MomentsPage } from './pages/MomentsPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';
import { useContactStore } from './stores/useContactStore';
import { useChatStore } from './stores/useChatStore';

const tabPages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const pageStack = useAppStore((state) => state.pageStack);
  const topRoute = pageStack[pageStack.length - 1];
  const isTabLayerActive = topRoute.type === 'tabs';
  const TabPage = tabPages[currentTab];

  const loadContacts = useContactStore((state) => state.loadContacts);
  const loadChats = useChatStore((state) => state.loadChats);
  const contactsLoaded = useContactStore((state) => state.loaded);
  const chatsLoaded = useChatStore((state) => state.loaded);

  useEffect(() => {
    if (!contactsLoaded) loadContacts();
    if (!chatsLoaded) loadChats();
  }, [contactsLoaded, loadContacts, chatsLoaded, loadChats]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <div className="relative mx-auto max-w-phone h-full overflow-hidden bg-wechat-bg shadow-xl">
        {/* Tab 页面层 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            isTabLayerActive ? 'translate-x-0' : '-translate-x-full'
          }`}
          data-testid="tab-layer"
        >
          <TabPage />
          <TabBar />
        </div>

        {/* 子页面层：栈顶非 tabs 时渲染 */}
        {topRoute.type !== 'tabs' && (
          <div
            className="absolute inset-0 transition-transform duration-300 ease-in-out translate-x-0"
            data-testid="detail-layer"
          >
            {topRoute.type === 'chat-detail' && <ChatDetailPage />}
            {topRoute.type === 'contact-detail' && <ContactDetailPage />}
            {topRoute.type === 'moments' && <MomentsPage />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
