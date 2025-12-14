import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import TweetCard from '../components/TweetCard';
import { fetchPostById } from '../api/feedApi';
import { useFeed } from '../context/FeedContext';
import { Tweet } from '../types/feed';
import '../styles/TweetDetailScreen.css';

interface Props {
  tweetId: string;
  onBack: () => void;
  onSelectTweet?: (tweet: Tweet) => void;
  initialTweet?: Tweet | null;
}

const insertReplyIntoTree = (node: Tweet, parentId: string, reply: Tweet): Tweet => {
  if (node.id === parentId) {
    return {
      ...node,
      replies: node.replies + 1,
      thread: [...(node.thread ?? []), reply],
    };
  }

  if (!node.thread) {
    return node;
  }

  return {
    ...node,
    thread: node.thread.map((child) => insertReplyIntoTree(child, parentId, reply)),
  };
};

const updateThreadLike = (nodes: Tweet[] | undefined, updated: Tweet): Tweet[] | undefined => {
  if (!nodes) {
    return nodes;
  }

  return nodes.map((node) =>
    node.id === updated.id
      ? { ...node, likes: updated.likes }
      : { ...node, thread: updateThreadLike(node.thread, updated) },
  );
};

const TweetDetailScreen: React.FC<Props> = ({ tweetId, onBack, onSelectTweet, initialTweet }) => {
  const { likeTweet, replyToPost } = useFeed();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [isLoading, setIsLoading] = useState(!initialTweet);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; handle: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(!initialTweet);
    setError(null);
    setReplyTarget(null);
    setTweet(initialTweet ?? null);
    fetchPostById(tweetId)
      .then((response) => {
        if (isMounted) {
          setTweet(response);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (!initialTweet) {
            setError((err as Error).message);
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tweetId, initialTweet]);

  const replyTargetHandle = useMemo(() => {
    if (replyTarget) {
      return replyTarget.handle;
    }
    return tweet ? `@${tweet.author.handle}` : '';
  }, [replyTarget, tweet]);

  const handleLikeRoot = useCallback(
    async (target: Tweet) => {
      if (isLiking) return;
      setIsLiking(true);
      try {
        const updated = await likeTweet(target.id);
        setTweet((prev) => (prev ? { ...prev, likes: updated.likes } : prev));
      } finally {
        setIsLiking(false);
      }
    },
    [isLiking, likeTweet],
  );

  const handleLikeThread = useCallback(
    async (target: Tweet) => {
      const updated = await likeTweet(target.id);
      setTweet((prev) =>
        prev
          ? {
              ...prev,
              thread: updateThreadLike(prev.thread, updated),
            }
          : prev,
      );
    },
    [likeTweet],
  );

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!replyText.trim() || !tweet) {
      return;
    }

    const parentId = replyTarget?.id ?? tweet.id;
    setIsReplying(true);
    try {
      const newReply = await replyToPost(parentId, replyText, tweet.id);
      setTweet((prev) => (prev ? insertReplyIntoTree(prev, parentId, newReply) : prev));
      setReplyText('');
      setReplyTarget(null);
    } finally {
      setIsReplying(false);
    }
  };

  const renderThread = useCallback(
    (nodes?: Tweet[], depth = 1) =>
      nodes?.map((reply) => (
        <div key={reply.id} className="tweet-detail__thread-item" style={{ marginLeft: depth * 24 }}>
          <TweetCard
            tweet={reply}
            variant="thread"
            onLike={handleLikeThread}
            onSelect={onSelectTweet}
          />
          {renderThread(reply.thread, depth + 1)}
        </div>
      )),
    [handleLikeThread, onSelectTweet],
  );

  return (
    <section className="tweet-detail">
      <button className="tweet-detail__back" onClick={onBack}>
        ← Back
      </button>

      {isLoading && <p className="tweet-detail__status">Loading post...</p>}
      {error && <p className="tweet-detail__status tweet-detail__status--error">{error}</p>}
      {!isLoading && tweet && (
        <>
          <TweetCard tweet={tweet} onLike={handleLikeRoot} />
          <div className="tweet-detail__actions">
            <span>{tweet.likes} Likes</span>
            <span>{tweet.replies} Replies</span>
          </div>

          <form className="tweet-detail__reply" onSubmit={handleReply}>
            <div className="tweet-detail__reply-target">
              Replying to <strong>{replyTargetHandle}</strong>
              {replyTarget && (
                <button type="button" onClick={() => setReplyTarget(null)}>
                  Reply to original
                </button>
              )}
            </div>
            <textarea
              placeholder="Add your reply..."
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              rows={3}
            />
            <button type="submit" disabled={isReplying}>
              {isReplying ? 'Posting...' : 'Reply'}
            </button>
          </form>

          <div className="tweet-detail__thread">
            {(tweet.thread ?? []).length === 0 && <p className="tweet-detail__status">No replies yet.</p>}
            {renderThread(tweet.thread)}
          </div>
        </>
      )}
    </section>
  );
};

export default TweetDetailScreen;
