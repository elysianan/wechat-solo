// 从核心类型模块统一导出 Agent 相关类型，避免循环依赖
export type {
  AgentBehavior,
  AgentPersona,
  ReplyRule,
  ReplyTrigger,
} from '../types';
