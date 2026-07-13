import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { db } from '../db/database';
import { initializeDatabase } from '../db/init';
import { useChatStore } from '../stores/useChatStore';
import { useContactStore } from '../stores/useContactStore';
import { useAppStore } from '../stores/useAppStore';
import { PERSONAS } from '../data/personas';

describe('Chat Core Flow', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    await db.delete();
    await db.open();
    useChatStore.setState({
      conversations: [],
      messages: {},
      loaded: false,
      replyTimeScale: 0,
      typingConversations: {},
    });
    useContactStore.setState({ me: null, contacts: [], loaded: false });
    useAppStore.setState({ currentTab: 'chats', pageStack: [{ type: 'tabs' }] });
    await initializeDatabase();
    await useContactStore.getState().loadContacts();
    await useChatStore.getState().loadChats();
  });

  it('完整流程：进入详情、发送消息、收到 Agent 回复、返回后列表预览更新', async () => {
    // 消除随机性：让 mom 一定会回复
    await db.contacts.where('id').equals('mom').modify((contact) => {
      contact.persona.behavior.readButNoReplyChance = 0;
    });

    // mom 默认回复池(动态取自规则库, 不硬编码台词, 内容扩容不受影响)
    const momDefaultReplies =
      PERSONAS.find((p) => p.id === 'mom')!.rules.find((r) => r.triggers.default)!.responses;

    render(<App />);

    // 等待聊天列表渲染
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-list-item').length).toBeGreaterThan(0);
    });

    // 点击 mom 的会话进入详情
    const momItem = screen.getAllByTestId('chat-list-item').find((el) =>
      el.textContent?.includes('王阿姨')
    );
    expect(momItem).toBeDefined();
    fireEvent.click(momItem!);
    await waitFor(() => {
      expect(screen.getByTestId('chat-detail-page')).toBeInTheDocument();
    });

    // 发送新消息
    fireEvent.change(screen.getByTestId('text-input'), { target: { value: '集成测试消息' } });
    fireEvent.click(screen.getByTestId('send-button'));
    await waitFor(() => {
      expect(
        screen.getAllByTestId('message-content').some((el) => el.textContent === '集成测试消息')
      ).toBe(true);
    });

    // 等待 Agent 回复出现（timeScale=0，很快）
    await waitFor(() => {
      const messages = screen.getAllByTestId('message-content');
      const hasAgentReply = messages.some((el) => {
        return momDefaultReplies.some((text) => el.textContent?.includes(text));
      });
      expect(hasAgentReply).toBe(true);
    });

    // 返回列表
    fireEvent.click(screen.getByTestId('header-back'));
    await waitFor(() => {
      expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    });

    // 列表最后消息预览更新为 Agent 回复或用户消息
    const momItemAfter = screen.getAllByTestId('chat-list-item').find((el) =>
      el.textContent?.includes('王阿姨')
    );
    expect(momItemAfter).toBeDefined();

    const previewAfter = momItemAfter!.textContent;
    const isUserPreview = previewAfter?.includes('集成测试消息');
    const isAgentPreview = momDefaultReplies.some((text) =>
      previewAfter?.includes(text)
    );
    expect(isUserPreview || isAgentPreview).toBe(true);
  });
});
