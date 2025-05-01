import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import type { User } from 'firebase/auth';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, authLoading };
}
