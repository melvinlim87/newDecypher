import { database } from '../lib/firebase';
import { ref, get, update, query, orderByKey } from 'firebase/database';
import { generateUniqueReferralCode } from './referralUtils';

/**
 * Utility function to migrate all existing user referral codes to the new name-based format
 * This is meant to be run once manually to update all users in the system
 */
export async function migrateAllCodesNow(): Promise<string[]> {
  const results: string[] = [];
  try {
    // Get all users from the database
    const usersRef = ref(database, 'users');
    const usersQuery = query(usersRef, orderByKey());
    const snapshot = await get(usersQuery);
    
    if (!snapshot.exists()) {
      console.log('No users found to migrate');
      return results;
    }
    
    const users = snapshot.val();
    const userIds = Object.keys(users);
    console.log(`Found ${userIds.length} users to check for migration`);
    
    // Process each user
    let migratedCount = 0;
    for (const uid of userIds) {
      const userData = users[uid];
      const userName = userData.name || '';
      const currentCode = userData.referralCode || '';
      
      // Check if the code needs migration (looks like old 8-char random code)
      const codeIsUIDBasedPattern = /^[a-zA-Z0-9]{8}$/;
      const codeAppearsToBeUIDBasedFormat = codeIsUIDBasedPattern.test(currentCode);
      const codeAppearsToBeName = currentCode.toLowerCase().includes(userName.toLowerCase().replace(/[^a-z0-9]/gi, ''));
      
      if (currentCode && codeAppearsToBeUIDBasedFormat && !codeAppearsToBeName) {
        // Generate new name-based referral code
        const newReferralCode = await generateUniqueReferralCode(userName, uid);
        
        // Update in database
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
          referralCode: newReferralCode,
          updatedAt: new Date().toISOString()
        });
        
        migratedCount++;
        const resultMsg = `Migrated user ${userData.email || uid}: ${currentCode} → ${newReferralCode}`;
        console.log(resultMsg);
        results.push(resultMsg);
      }
    }
    
    console.log(`Migration completed. Updated ${migratedCount} out of ${userIds.length} users.`);
    results.push(`Migration completed. Updated ${migratedCount} out of ${userIds.length} users.`);
    return results;
  } catch (error) {
    console.error('Error during migration:', error);
    results.push(`Error: ${error.message}`);
    return results;
  }
}
