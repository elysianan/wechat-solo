import { cn } from '../../utils/cn';

interface AlphabetIndexProps {
  letters: string[];
  activeLetter?: string;
  onLetterClick: (letter: string) => void;
}

// 右侧字母索引条：点击后滚动到对应分组
export function AlphabetIndex({ letters, activeLetter, onLetterClick }: AlphabetIndexProps) {
  return (
    <div
      className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center py-2 text-xs text-wechat-text-secondary z-20"
      data-testid="alphabet-index"
    >
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterClick(letter)}
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded-full',
            activeLetter === letter ? 'bg-wechat-green text-white' : 'text-wechat-text-secondary'
          )}
          data-testid={`letter-${letter}`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
