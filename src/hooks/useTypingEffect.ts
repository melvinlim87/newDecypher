import { useState, useEffect } from 'react';

interface TypingEffectOptions {
  typingSpeed?: number;
  delayAfterTyping?: number;
}

export const useTypingEffect = (text: string, options: TypingEffectOptions = {}) => {
  const { typingSpeed = 50, delayAfterTyping = 0 } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    let timeoutId: NodeJS.Timeout;
    setIsTyping(true);
    
    const updateText = () => {
      if (i < text.length) {
        // Update character by character for smooth typing effect
        setDisplayedText(text.slice(0, i + 1));
        i++;
        timeoutId = setTimeout(updateText, typingSpeed);
      } else {
        setIsTyping(false);
        if (delayAfterTyping > 0) {
          timeoutId = setTimeout(() => setIsTyping(false), delayAfterTyping);
        }
      }
    };

    timeoutId = setTimeout(updateText, 0);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, typingSpeed, delayAfterTyping]);

  return { displayedText, isTyping };
};
