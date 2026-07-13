/**
 * 将 public 目录下的资源路径解析为带 base 前缀的完整路径。
 *
 * 子路径部署（如 GitHub Pages 的 /wechat-solo/）时，public 资源的绝对路径
 * 不会自动拼 base，直接 <img src="/avatar-mom.svg"> 会请求到站点根目录而 404。
 * 这里统一补上 import.meta.env.BASE_URL，已存库的绝对路径数据也能正确显示。
 *
 * @param path - 资源路径，如 '/avatar-mom.svg'
 * @returns 带 base 前缀的完整路径，如 '/wechat-solo/avatar-mom.svg'
 */
export function assetUrl(path: string | undefined): string | undefined {
  if (!path) return path;
  // 已是完整的 http(s) 绝对地址，不处理
  if (/^https?:\/\//.test(path)) return path;
  // BASE_URL 以 '/' 结尾（如 '/wechat-solo/'），去掉 path 前导 '/' 再拼接，避免双斜杠
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
