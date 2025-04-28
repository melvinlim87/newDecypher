import { auth, database } from '../lib/firebase';
import { ref, get, set, increment, update, query, orderByChild, equalTo } from 'firebase/database';

const REFERRAL_BONUS_TOKENS = 200000;
const PRO_UPGRADE_BONUS_TOKENS = 5000000;

/**
 * Generates a unique referral code based on user's name
 * @param name User's display name
 * @param uid User's UID (used as fallback and to ensure uniqueness)
 * @returns A unique referral code
 */
export async function generateUniqueReferralCode(name: string, uid: string): Promise<string> {
  try {
    // Safety check for uid
    if (!uid) {
      return 'user' + Math.random().toString(36).substring(2, 10);
    }

    if (!name || name.trim() === '') {
      // Fallback to first 8 chars of UID if no name provided
      return uid.substring(0, 8);
    }

    // Create base code from name: lowercase, remove spaces and special chars
    let baseCode = name.toLowerCase()
      .replace(/[^a-z0-9]/gi, '') // Remove non-alphanumeric
      .substring(0, 12); // Limit to 12 chars max
    
    if (baseCode.length < 3) {
      // If resulting baseCode is too short, append part of UID
      baseCode += uid.substring(0, 3);
    }

    // Generate random 5 character string (alphanumeric)
    const generateRandomString = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Try with the name + 5 random chars
    let randomSuffix = generateRandomString(5);
    let codeToTry = `${baseCode}${randomSuffix}`;
    let isUnique = await checkReferralCodeUniqueness(codeToTry);
    
    // If not unique, try with different random strings until we find a unique one
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      randomSuffix = generateRandomString(5);
      codeToTry = `${baseCode}${randomSuffix}`;
      isUnique = await checkReferralCodeUniqueness(codeToTry);
      attempts++;
    }
    
    // If still not unique after attempts, use UID-based fallback
    if (!isUnique) {
      const timestamp = new Date().getTime().toString().slice(-4);
      randomSuffix = generateRandomString(3);
      codeToTry = `${baseCode.substring(0, 6)}${randomSuffix}${timestamp}`;
    }
    
    return codeToTry;
  } catch (error) {
    // Silently handle error without logging to console
    // Fallback to UID-based code in case of error
    return uid && typeof uid === 'string' ? uid.substring(0, 8) : 'user' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Checks if a referral code is already in use
 * @param code Referral code to check
 * @returns Boolean indicating if code is unique (true) or already in use (false)
 */
async function checkReferralCodeUniqueness(code: string): Promise<boolean> {
  try {
    // Query users collection to find any with this referral code
    const usersRef = ref(database, 'users');
    const codeQuery = query(usersRef, orderByChild('referralCode'), equalTo(code));
    const snapshot = await get(codeQuery);
    
    // If no data exists, the code is unique
    return !snapshot.exists();
  } catch (error) {
    // Silently handle permission errors without logging to console
    return false;
  }
}

export async function handleReferral(referralCode: string): Promise<void> {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const referralRef = ref(database, `referrals/${referralCode}`);
    const snapshot = await get(referralRef);

    if (!snapshot.exists()) {
      throw new Error('Invalid referral code');
    }

    const referralData = snapshot.val();
    if (referralData.claimed) {
      throw new Error('Referral code already claimed');
    }

    const userRef = ref(database, `users/${auth.currentUser.uid}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val() || {};

    if (userData.referralClaimed) {
      throw new Error('User has already claimed a referral');
    }

    // Update referral status
    await update(referralRef, { claimed: true });

    // Update user data
    await update(userRef, {
      referralClaimed: true,
      tokens: (userData.tokens || 0) + REFERRAL_BONUS_TOKENS
    });

  } catch (error) {
    throw error;
  }
}

export async function rewardProUpgrade(userId: string): Promise<void> {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val();
    const currentTokens = userData.tokens || 0;

    await update(userRef, {
      tokens: currentTokens + PRO_UPGRADE_BONUS_TOKENS,
      proUpgradeRewarded: true
    });

  } catch (error) {
    throw error;
  }
}
