import React, { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

interface AnimatedIntroProps {
  onComplete: () => void;
}

export function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  useEffect(() => {
    // Call onComplete immediately
    onComplete();
  }, [onComplete]);

  return null;
}