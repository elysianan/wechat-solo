import { useEffect } from 'react';
import { TabBar } from './components/common/TabBar';
import { Watermark } from './components/common/Watermark';
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
import { GroupListPage } from './pages/GroupListPage';
import { GroupInfoPage } from './pages/GroupInfoPage';
import { TagListPage } from './pages/TagListPage';
import { TagDetailPage } from './pages/TagDetailPage';
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
        {/* Tab 页面层：固定底层，由子页面层覆盖，不参与滑动（避免双层动画叠加回弹） */}
        <div className="absolute inset-0" data-testid="tab-layer">
          <TabPage />
          <TabBar />
        </div>

        {/* 子页面层：用 left 定位做滑动动画，不用 transform——避免 transform 祖先
            导致内部 fixed(MessageInput)/sticky(Header) 定位错乱（Header 消失/回弹） */}
        <div
          className={`absolute inset-y-0 w-full transition-[left] duration-300 ease-out ${
            isDetailActive ? 'left-0' : 'left-full'
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
          {topRoute.type === 'group-list' && <GroupListPage />}
          {topRoute.type === 'group-info' && <GroupInfoPage />}
          {topRoute.type === 'tag-list' && <TagListPage />}
          {topRoute.type === 'tag-detail' && <TagDetailPage />}
        </div>

        {/* 底部水印 */}
        <Watermark />
      </div>
    </div>
  );
}

export default App;
