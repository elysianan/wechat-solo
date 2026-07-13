import { useEffect, useState } from 'react';
import { MomentCoverHeader } from '../components/moments/MomentCoverHeader';
import { MomentCard } from '../components/moments/MomentCard';
import { BottomInputSheet } from '../components/moments/BottomInputSheet';
import { useAppStore } from '../stores/useAppStore';
import { useContactStore } from '../stores/useContactStore';
import { useMomentStore } from '../stores/useMomentStore';

// 朋友圈列表页
export function MomentsPage() {
  const popPage = useAppStore((state) => state.popPage);
  const me = useContactStore((state) => state.me);
  const moments = useMomentStore((state) => state.moments);
  const loaded = useMomentStore((state) => state.loaded);
  const loadMoments = useMomentStore((state) => state.loadMoments);
  const addComment = useMomentStore((state) => state.addComment);
  const [commentMomentId, setCommentMomentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadMoments();
  }, [loaded, loadMoments]);

  const handleCommentSubmit = (content: string) => {
    if (commentMomentId) {
      addComment(commentMomentId, content);
    }
    setCommentMomentId(null);
  };

  return (
    <div className="min-h-screen bg-wechat-card pb-4" data-testid="moments-page">
      <MomentCoverHeader me={me} onBack={popPage} />
      <div className="mt-10">
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onCommentClick={setCommentMomentId}
          />
        ))}
      </div>
      <BottomInputSheet
        visible={commentMomentId !== null}
        onSubmit={handleCommentSubmit}
        onCancel={() => setCommentMomentId(null)}
      />
    </div>
  );
}
