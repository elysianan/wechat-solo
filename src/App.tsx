import { TabBar } from './components/common/TabBar';
import { ChatPage } from './pages/ChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MePage } from './pages/MePage';
import { useAppStore } from './stores/useAppStore';

const pages = {
  chats: ChatPage,
  contacts: ContactsPage,
  discover: DiscoverPage,
  me: MePage,
};

function App() {
  const currentTab = useAppStore((state) => state.currentTab);
  const Page = pages[currentTab];

  return (
    <div className="min-h-screen bg-wechat-bg pb-16">
      <Page />
      <TabBar />
    </div>
  );
}

export default App;
