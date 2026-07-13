import type { AgentPersona } from '../../types';
import { momPersona } from './mom';
import { bossPersona } from './boss';
import { buddyPersona } from './buddy';
import { lisaPersona } from './lisa';
import { landlordPersona } from './landlord';

// 人设草稿: 各人设文件导出的类型, 不含 version(由本文件统一注入)
export type PersonaDraft = Omit<AgentPersona, 'version'>;

// 规则库版本号: 每次修改规则库内容(增删规则/台词/话题池)必须 +1,
// 旧 IndexedDB 数据会在 initializeDatabase 时检测版本并重写 persona
export const PERSONA_VERSION = 2;

// 人设总表: version 在此统一注入, 单点控制
export const PERSONAS: AgentPersona[] = [
  momPersona,
  bossPersona,
  buddyPersona,
  lisaPersona,
  landlordPersona,
].map((persona) => ({ ...persona, version: PERSONA_VERSION }));

// 剧情链数据(详见 storyChains.ts)
export { STORY_CHAINS } from './storyChains';
