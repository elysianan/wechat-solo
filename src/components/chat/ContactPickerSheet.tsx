import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { assetUrl } from '../../utils/asset';
import type { Contact } from '../../types';

interface ContactPickerSheetProps {
  visible: boolean;
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onClose: () => void;
}

export function ContactPickerSheet({ visible, contacts, onSelect, onClose }: ContactPickerSheetProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [contacts, query]
  );

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      data-testid="contact-picker-sheet"
      onClick={onClose}
    >
      <div className="bg-wechat-bg rounded-t-2xl max-h-[70%] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-wechat-divider">
          <span className="text-base font-medium">选择联系人</span>
          <button type="button" onClick={onClose} data-testid="contact-picker-close">
            <X size={20} />
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            placeholder="搜索联系人"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-wechat-card rounded px-3 py-2 text-sm outline-none"
            data-testid="contact-picker-search"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelect(contact)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-wechat-bg transition-colors"
              data-testid="contact-picker-item"
            >
              <img
                src={assetUrl(contact.avatar)}
                alt={contact.name}
                className="w-10 h-10 rounded bg-wechat-bg object-cover"
              />
              <span className="text-sm text-wechat-text-primary">{contact.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
