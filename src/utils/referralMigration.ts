import { database, auth } from '../lib/firebase';
import { ref, get, update, query, orderByKey } from 'firebase/database';
import { generateUniqueReferralCode } from './referralUtils';

/**
 * Callback type for migration progress
 */
type MigrationProgressCallback = (
  uid: string,
  newCode: string | null,
  oldCode: string,
  currentCount: number,
  totalCount: number
) => void;

/**
 * Migrates an existing user's referral code to the new name-based format
 * @param uid User ID to migrate
 * @param progressCallback Optional callback to report progress
 * @returns Promise that resolves with the new code when migration is complete, or null if no migration was needed
 */
export async function migrateUserReferralCode(
  uid: string, 
  progressCallback?: MigrationProgressCallback
): Promise<string | null> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
     
      return null;
    }
    
    const userData = snapshot.val();
    const userName = userData.name || '';
    
    // Check if referral code appears to be UID-based (8 chars, looks random)
    const currentCode = userData.referralCode || '';
    const codeIsUIDBasedPattern = /^[a-zA-Z0-9]{8}$/;
    const codeAppearsToBeUIDBasedFormat = codeIsUIDBasedPattern.test(currentCode);
    const codeAppearsToBeName = currentCode.toLowerCase().includes(userName.toLowerCase().replace(/[^a-z0-9]/gi, ''));
    
    // Only migrate if the code appears to be UID-based and not already name-based
    if (currentCode && codeAppearsToBeUIDBasedFormat && !codeAppearsToBeName) {
     
      
      // Generate new name-based code
      const newReferralCode = await generateUniqueReferralCode(userName, uid);
      
      // Update the user's referral code
      await update(userRef, {
        referralCode: newReferralCode,
        updatedAt: new Date().toISOString()
      });
      
      // console.log removed: `Successfully migrated referral code from ${currentCode} to ${newReferralCode}`);
      
      // Report progress if callback provided
      if (progressCallback) {
        progressCallback(uid, newReferralCode, currentCode, 1, 1);
      }
      
      return newReferralCode;
    } else {
      // console.log removed: `User ${uid} already has a proper name-based code or no code to migrate`);
      return null;
    }
  } catch (error) {
    console.error(`Error migrating referral code for user ${uid}:`, error);
    return null;
  }
}

/**
 * Migrates the currently logged-in user's referral code
 * @returns Promise that resolves with the new referral code or null if no migration was needed
 */
export async function migrateCurrentUserReferralCode(): Promise<string | null> {
  try {
    if (!auth.currentUser) {
      // console.log removed: 'No logged-in user to migrate');
      return null;
    }
    
    return await migrateUserReferralCode(auth.currentUser.uid);
  } catch (error) {
    console.error('Error in current user referral code migration:', error);
    return null;
  }
}

/**
 * For admin use only - migrates all users' referral codes in the database
 * WARNING: This could be resource-intensive with large user bases
 * @param progressCallback Optional callback to report progress
 */
export async function migrateAllUserReferralCodes(
  progressCallback?: MigrationProgressCallback
): Promise<void> {
  try {
    const usersRef = ref(database, 'users');
    const usersQuery = query(usersRef, orderByKey());
    const snapshot = await get(usersQuery);
    
    if (!snapshot.exists()) {
      // console.log removed: 'No users found to migrate');
      return;
    }
    
    const users = snapshot.val();
    const userIds = Object.keys(users);
    // console.log removed: `Found ${userIds.length} users to check for migration`);
    
    // Process each user sequentially to avoid overwhelming database
    let processedCount = 0;
    for (const uid of userIds) {
      processedCount++;
      const userData = users[uid];
      const oldCode = userData.referralCode || '';
      
      // Migrate the user
      const newCode = await migrateUserReferralCode(uid, progressCallback);
      
      // Report progress if callback provided
      if (progressCallback) {
        progressCallback(uid, newCode, oldCode, processedCount, userIds.length);
      }
    }
    
    // console.log removed: 'Completed migration process for all users');
  } catch (error) {
    console.error('Error migrating all user referral codes:', error);
    throw error; // Re-throw to let caller handle the error
  }
}
