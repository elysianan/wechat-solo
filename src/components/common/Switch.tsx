interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  testId?: string;
}

// 微信风格开关
export function Switch({ checked, onChange, testId }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-wechat-green' : 'bg-gray-300'
      }`}
      data-testid={testId}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
