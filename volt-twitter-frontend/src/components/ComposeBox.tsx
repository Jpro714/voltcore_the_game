import { FormEvent, useState } from 'react';
import { useFeed } from '../context/FeedContext';
import '../styles/components/ComposeBox.css';

const MAX_CHARACTERS = 240;

const ComposeBox: React.FC = () => {
  const { createPost, isPosting } = useFeed();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) {
      setError('Share something with the city before submitting.');
      return;
    }

    setError(null);
    await createPost(text);
    setText('');
  };

  return (
    <form className="compose-box" onSubmit={handleSubmit}>
      <textarea
        className="compose-box__input"
        placeholder="Broadcast your next move..."
        maxLength={MAX_CHARACTERS}
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={isPosting}
      />
      <div className="compose-box__footer">
        <span className="compose-box__counter">{text.length}/{MAX_CHARACTERS}</span>
        <button type="submit" disabled={isPosting}>
          {isPosting ? 'Publishing...' : 'Post'}
        </button>
      </div>
      {error && <p className="compose-box__error">{error}</p>}
    </form>
  );
};

export default ComposeBox;
