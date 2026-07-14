import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import type { Moment } from '../../types';
import { useContactStore } from '../../stores/useContactStore';
import { useMomentStore } from '../../stores/useMomentStore';
import { MomentImageGrid } from './MomentImageGrid';
import { formatChatTime } from '../../utils/time';
import { cn } from '../../utils/cn';
import { assetUrl } from '../../utils/asset';

interface MomentCardProps {
  moment: Moment;
  onCommentClick: (momentId: string) => void;
  onImageClick?: (momentId: string, index: number) => void;
}

// 单条朋友圈卡片
export function MomentCard({ moment, onCommentClick, onImageClick }: MomentCardProps) {
  const author = useContactStore((state) =>
    state.contacts.find((c) => c.id === moment.authorId)
  );
  const toggleLike = useMomentStore((state) => state.toggleLike);
  const deleteComment = useMomentStore((state) => state.deleteComment);
  const contacts = useContactStore((state) => state.contacts);
  const hasLiked = moment.likes.some((like) => like.contactId === 'me');
  // 当前展开「删除」气泡的评论 id（仅自己的评论可展开）
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  // 点赞时的弹跳动画标记
  const [likeAnimating, setLikeAnimating] = useState(false);
  // 记录最新一条评论 id，用于进入动画
  const lastCommentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const lastComment = moment.comments[moment.comments.length - 1];
    if (lastComment && lastComment.id !== lastCommentIdRef.current) {
      lastCommentIdRef.current = lastComment.id;
    }
  }, [moment.comments]);

  if (!author) return null;

  const likedNames = moment.likes
    .map((like) => {
      if (like.contactId === 'me') return '我';
      return contacts.find((c) => c.id === like.contactId)?.name ?? '';
    })
    .filter(Boolean)
    .join('、');

  return (
    <div className="px-4 py-4 border-b border-wechat-divider bg-wechat-card" data-testid="moment-card">
      <div className="flex">
        <img src={assetUrl(author.avatar)} alt={author.name} className="w-10 h-10 rounded bg-wechat-bg object-cover" />
        <div className="ml-3 flex-1">
          <div className="text-base font-medium text-wechat-text-primary">{author.name}</div>
          <div className="text-sm text-wechat-text-primary mt-1">{moment.content}</div>
          <MomentImageGrid
            images={moment.images}
            onImageClick={(index) => onImageClick?.(moment.id, index)}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-wechat-text-secondary">{formatChatTime(moment.createdAt)}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!hasLiked) {
                    setLikeAnimating(true);
                    setTimeout(() => setLikeAnimating(false), 400);
                  }
                  toggleLike(moment.id);
                }}
                className={cn(
                  'flex items-center gap-1',
                  hasLiked ? 'text-red-500' : 'text-wechat-text-secondary'
                )}
                data-testid="moment-like-button"
              >
                <Heart
                  size={18}
                  fill={hasLiked ? 'currentColor' : 'none'}
                  className={cn(likeAnimating && 'animate-like-bounce')}
                />
              </button>
              <button
                onClick={() => onCommentClick(moment.id)}
                className="flex items-center text-wechat-text-secondary"
                data-testid="moment-comment-button"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          {likedNames && (
            <div className="mt-2 text-sm text-wechat-text-primary bg-wechat-bg px-2 py-1 rounded" data-testid="moment-likes">
              <Heart size={14} className="inline text-red-500 mr-1" fill="currentColor" />
              {likedNames}
            </div>
          )}

          {moment.comments.length > 0 && (
            <div className="mt-2 bg-wechat-bg px-2 py-1 rounded" data-testid="moment-comments">
              {moment.comments.map((comment, index) => {
                const commenter = contacts.find((c) => c.id === comment.contactId);
                const name = comment.contactId === 'me' ? '我' : commenter?.name ?? '';
                const isMine = comment.contactId === 'me';
                const isLatest = index === moment.comments.length - 1;
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      'text-sm text-wechat-text-primary flex items-center',
                      isLatest && 'animate-slide-up'
                    )}
                  >
                    <span
                      onClick={
                        isMine
                          ? () =>
                              setActiveCommentId(
                                activeCommentId === comment.id ? null : comment.id
                              )
                          : undefined
                      }
                      className={isMine ? 'cursor-pointer' : ''}
                      data-testid={`moment-comment-${comment.id}`}
                    >
                      <span className="font-medium">{name}</span>：{comment.content}
                    </span>
                    {isMine && activeCommentId === comment.id && (
                      <button
                        onClick={() => {
                          deleteComment(moment.id, comment.id);
                          setActiveCommentId(null);
                        }}
                        className="ml-2 text-xs text-white bg-wechat-text-secondary px-2 py-0.5 rounded"
                        data-testid="comment-delete-button"
                      >
                        删除
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
