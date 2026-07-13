import { describe, it, expect } from 'vitest';
import { assetUrl } from '../../utils/asset';

describe('assetUrl', () => {
  const BASE = import.meta.env.BASE_URL;

  it('以 / 开头的 public 资源路径拼上 base 前缀', () => {
    expect(assetUrl('/avatar-mom.svg')).toBe(`${BASE}avatar-mom.svg`);
  });

  it('不带前导 / 的路径也能正确拼接', () => {
    expect(assetUrl('avatar-mom.svg')).toBe(`${BASE}avatar-mom.svg`);
  });

  it('http(s) 绝对地址原样返回，不拼 base', () => {
    expect(assetUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(assetUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
  });

  it('空字符串原样返回', () => {
    expect(assetUrl('')).toBe('');
  });

  it('undefined 原样返回', () => {
    expect(assetUrl(undefined)).toBeUndefined();
  });
});
