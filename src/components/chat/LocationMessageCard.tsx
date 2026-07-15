import type { LocationMessage } from '../../types';

interface LocationMessageCardProps {
  message: LocationMessage;
  onClick?: () => void;
}

export function LocationMessageCard({ message, onClick }: LocationMessageCardProps) {
  return (
    <div
      className="w-[220px] rounded-lg overflow-hidden bg-wechat-card cursor-pointer"
      data-testid="location-message-card"
      onClick={onClick}
    >
      <div
        className="h-[100px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700"
        data-testid="location-map-placeholder"
      />
      <div className="p-2">
        <div className="text-sm font-medium text-wechat-text-primary truncate">{message.name}</div>
        <div className="text-xs text-wechat-text-secondary truncate mt-0.5">{message.address}</div>
      </div>
    </div>
  );
}
