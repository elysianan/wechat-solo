import { useEffect } from 'react';
import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MomentsPage } from './pages/MomentsPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { PayPage } from './pages/PayPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';
import { useContactStore } from './stores/useContactStore';
import { useChatStore } from './stores/useChatStore';
import { useSettingsStore } from './stores/useSettingsStore';

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
  const isDetailActive = topRoute.type !== 'tabs';
  const TabPage = tabPages[currentTab];

  const loadContacts = useContactStore((state) => state.loadContacts);
  const loadChats = useChatStore((state) => state.loadChats);
  const contactsLoaded = useContactStore((state) => state.loaded);
  const chatsLoaded = useChatStore((state) => state.loaded);

  // 设置：深色模式 + 启动加载
  const darkMode = useSettingsStore((state) => state.darkMode);
  const settingsLoaded = useSettingsStore((state) => state.loaded);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    if (!contactsLoaded) loadContacts();
    if (!chatsLoaded) loadChats();
    if (!settingsLoaded) loadSettings();
  }, [contactsLoaded, loadContacts, chatsLoaded, loadChats, settingsLoaded, loadSettings]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <div
        className="relative mx-auto max-w-phone h-full overflow-hidden bg-wechat-bg shadow-xl"
        data-theme={darkMode ? 'dark' : 'light'}
        data-testid="phone-shell"
      >
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

        {/* 子页面层：始终挂载以支持滑入/滑出动画；通过 translate 类名控制显隐 */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            isDetailActive ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid="detail-layer"
        >
          {topRoute.type === 'chat-detail' && <ChatDetailPage />}
          {topRoute.type === 'contact-detail' && <ContactDetailPage />}
          {topRoute.type === 'moments' && <MomentsPage />}
          {topRoute.type === 'profile-edit' && <ProfileEditPage />}
          {topRoute.type === 'pay' && <PayPage />}
          {topRoute.type === 'settings' && <SettingsPage />}
          {topRoute.type === 'about' && <AboutPage />}
        </div>
      </div>
    </div>
  );
}

export default App;
