const authService = require('../services/authService');

/**
 * Test script for leaderboard functionality
 */

async function testLeaderboard() {
  console.log('🧪 Testing Leaderboard System\n');
  
  try {
    // Test 1: Global Leaderboard
    console.log(' 1. Testing Global Leaderboard...');
    const globalLeaderboard = await authService.getGlobalLeaderboard(10);
    console.log(`✅ Found ${globalLeaderboard.length} players on global leaderboard`);
    if (globalLeaderboard.length > 0) {
      console.log('   Top player:', globalLeaderboard[0].username, '-', globalLeaderboard[0].total_audiofy_score, 'pts');
    }
    
    // Test 2: Solo Leaderboard
    console.log('\n 2. Testing Solo Leaderboard...');
    const soloLeaderboard = await authService.getSoloLeaderboard(10);
    console.log(`✅ Found ${soloLeaderboard.length} players on solo leaderboard`);
    if (soloLeaderboard.length > 0) {
      console.log('   Top player:', soloLeaderboard[0].username, '-', soloLeaderboard[0].solo_total_score, 'pts');
    }
    
    // Test 3: Multiplayer Leaderboard
    console.log('\n 3. Testing Multiplayer Leaderboard...');
    const multiLeaderboard = await authService.getMultiplayerLeaderboard(10);
    console.log(`✅ Found ${multiLeaderboard.length} players on multiplayer leaderboard`);
    if (multiLeaderboard.length > 0) {
      console.log('   Top player:', multiLeaderboard[0].username, '-', multiLeaderboard[0].multi_total_score, 'pts');
    }
    
    // Test 4: User Stats (if we have any users)
    if (globalLeaderboard.length > 0) {
      console.log('\n 4. Testing User Stats...');
      const testUserId = globalLeaderboard[0].user_id;
      const userStats = await authService.getUserStats(testUserId);
      console.log(`✅ Retrieved stats for user: ${userStats.username}`);
      console.log('   Global Rank:', userStats.global_rank);
      console.log('   Total Score:', userStats.total_audiofy_score);
      console.log('   Solo Games:', userStats.solo_games_played);
      console.log('   Multi Games:', userStats.multi_games_played);
      console.log('   Multi Wins:', userStats.multi_wins);
    }
    
    console.log('\n🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testLeaderboard()
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testLeaderboard };

