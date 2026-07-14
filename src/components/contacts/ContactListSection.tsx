import type { Contact } from '../../types';
import { assetUrl } from '../../utils/asset';

interface ContactListSectionProps {
  letter: string;
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
}

// 按字母分组的联系人列表区段：展示分组标题与联系人条目
export function ContactListSection({ letter, contacts, onContactClick }: ContactListSectionProps) {
  return (
    <div data-testid={`contact-section-${letter}`}>
      <div className="px-4 py-1 text-sm text-wechat-text-secondary bg-wechat-bg sticky top-12" data-testid="section-letter">
        {letter}
      </div>
      <div className="bg-wechat-card">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onContactClick(contact.id)}
            className="w-full flex items-center px-4 py-3 border-b border-wechat-divider last:border-b-0 active:bg-wechat-bg active:scale-[0.98] transition-transform duration-100"
            data-testid="contact-list-item"
          >
            <img src={assetUrl(contact.avatar)} alt={contact.name} className="w-10 h-10 rounded bg-wechat-bg object-cover" />
            <span className="ml-3 text-base text-wechat-text-primary">{contact.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
