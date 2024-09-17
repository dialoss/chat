import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <div className="text-sm text-pink-500 font-semibold italic">
      {text}
      <span className={styles.dots}>
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
};

export default TypingIndicator;