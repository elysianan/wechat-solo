import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/common/Header';
import { AlphabetIndex } from '../components/contacts/AlphabetIndex';
import { ContactListSection } from '../components/contacts/ContactListSection';
import { ContactTopEntries } from '../components/contacts/ContactTopEntries';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore, selectFilteredContacts } from '../stores/useContactStore';
import { pinyin } from 'pinyin-pro';

// 获取联系人首字母分组键：中文转拼音首字母，非 A-Z 归入 #
function getContactLetter(contact: { name: string }): string {
  const firstLetter = pinyin(contact.name.charAt(0), { pattern: 'first', toneType: 'none', type: 'string' });
  const upper = firstLetter.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(upper) ? upper : '#';
}

// 通讯录页面：展示顶部入口、搜索、A-Z 分组列表与右侧字母索引
export function ContactsPage() {
  const navigateToContactDetail = useAppStore((state) => state.navigateToContactDetail);
  const contacts = useContactStore((state) => state.contacts);
  const loaded = useContactStore((state) => state.loaded);
  const loadContacts = useContactStore((state) => state.loadContacts);
  const searchKeyword = useContactStore((state) => state.searchKeyword);
  const setSearchKeyword = useContactStore((state) => state.setSearchKeyword);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeLetter, setActiveLetter] = useState<string>('A');

  // 首次进入页面时加载联系人数据
  useEffect(() => {
    if (!loaded) loadContacts();
  }, [loaded, loadContacts]);

  // 根据搜索关键词过滤联系人
  const filteredContacts = useMemo(() => {
    const partialState = { contacts, searchKeyword } as Parameters<typeof selectFilteredContacts>[0];
    return selectFilteredContacts(partialState);
  }, [contacts, searchKeyword]);

  // 将过滤后的联系人按首字母分组并排序，# 排在最后
  const grouped = useMemo(() => {
    const map = new Map<string, typeof contacts>();
    for (const contact of filteredContacts) {
      const letter = getContactLetter(contact);
      const list = map.get(letter) ?? [];
      list.push(contact);
      map.set(letter, list);
    }
    return new Map(
      [...map.entries()].sort((a, b) => (a[0] === '#' ? 1 : b[0] === '#' ? -1 : a[0].localeCompare(b[0])))
    );
  }, [filteredContacts]);

  // 分组字母列表，用于右侧索引
  const letters = useMemo(() => Array.from(grouped.keys()), [grouped]);

  // 点击字母索引时滚动到对应分组
  const handleLetterClick = (letter: string) => {
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveLetter(letter);
    }
  };

  return (
    <div className="min-h-screen bg-wechat-bg pb-16" data-testid="contacts-page">
      <Header title="通讯录" />
      <div className="sticky top-12 z-10 px-3 py-2 bg-wechat-bg">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索"
          className="w-full bg-white rounded-md px-3 py-2 text-sm outline-none"
          data-testid="contacts-search"
        />
      </div>
      <ContactTopEntries />
      <div className="relative">
        {Array.from(grouped.entries()).map(([letter, list]) => (
          <div
            key={letter}
            ref={(el) => { sectionRefs.current[letter] = el; }}
          >
            <ContactListSection
              letter={letter}
              contacts={list}
              onContactClick={navigateToContactDetail}
            />
          </div>
        ))}
      </div>
      {/* 搜索时隐藏字母索引，结果平铺展示 */}
      {!searchKeyword && (
        <AlphabetIndex letters={letters} activeLetter={activeLetter} onLetterClick={handleLetterClick} />
      )}
    </div>
  );
}
