const authService = require('../services/authService');

async function testAuth() {
  try {
    console.log('🔐 Testing Authentication System...\n');
    
    // Test 1: Signup
    console.log(' 1. Testing Signup...');
    const testEmail = `test_${Date.now()}@audiofy.com`;
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = 'password123';
    
    const signupResult = await authService.signup(testEmail, testPassword, testUsername);
    console.log('✅ Signup successful!');
    console.log('   User:', signupResult.user.username);
    console.log('   Email:', signupResult.user.email);
    console.log('   Token:', signupResult.token.substring(0, 20) + '...');
    
    // Test 2: Login
    console.log('\n 2. Testing Login...');
    const loginResult = await authService.login(testEmail, testPassword);
    console.log('✅ Login successful!');
    console.log('   User:', loginResult.user.username);
    console.log('   Token:', loginResult.token.substring(0, 20) + '...');
    
    // Test 3: Verify Token
    console.log('\n 3. Testing Token Verification...');
    const verifiedUser = await authService.verifyToken(loginResult.token);
    console.log('✅ Token verified!');
    console.log('   User ID:', verifiedUser.id);
    console.log('   Username:', verifiedUser.username);
    
    // Test 4: Save Game
    console.log('\n 4. Testing Save Game...');
    const savedGame = await authService.saveGame(verifiedUser.id, 6, '80s', 45000);
    console.log('✅ Game saved!');
    console.log('   Game ID:', savedGame.id);
    console.log('   Score:', savedGame.score);
    console.log('   Decade:', savedGame.decade);
    
    // Test 5: Get User Games
    console.log('\n 5. Testing Get User Games...');
    const userGames = await authService.getUserGames(verifiedUser.id);
    console.log('✅ User games retrieved!');
    console.log('   Total games:', userGames.length);
    
    // Test 6: Get Leaderboard
    console.log('\n 6. Testing Leaderboard...');
    const leaderboard = await authService.getLeaderboard(null, 10);
    console.log('✅ Leaderboard retrieved!');
    console.log('   Total entries:', leaderboard.length);
    if (leaderboard.length > 0) {
      console.log('   Top player:', leaderboard[0].username, '-', leaderboard[0].score, 'points');
    }
    
    console.log('\n🎉 All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAuth();

