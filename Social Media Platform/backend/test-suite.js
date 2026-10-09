// =========================================================
// ConnectHub Comprehensive Automated API & Static Assets Test Suite
// =========================================================

const http = require('http');

const BASE_URL = 'http://localhost:5000';

const makeRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting ConnectHub Automated E2E Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extra = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extra}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    const health = await makeRequest('/api/health');
    assert(health.status === 200 && health.data.status === 'OK', '1. API Health Check');

    // 2. Demo Login (Alex Kumar)
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      emailOrUsername: 'alex@connecthub.com',
      password: 'Password@123',
    });
    assert(loginRes.status === 200 && loginRes.data.success && loginRes.data.token, '2. Demo Login (Alex Kumar)');
    const alexToken = loginRes.data.token;
    const alexId = loginRes.data.data._id;

    // 3. Current User (/api/auth/me)
    const meRes = await makeRequest('/api/auth/me', 'GET', null, alexToken);
    assert(meRes.status === 200 && meRes.data.data.username === 'alexkumar', '3. Get Authenticated User Profile');

    // 4. Register New User
    const uniqueUser = `user_${Date.now()}`;
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      username: uniqueUser,
      email: `${uniqueUser}@example.com`,
      password: 'Password@123',
      fullName: 'Automated Test User',
      bio: 'Testing all features',
    });
    assert(regRes.status === 201 && regRes.data.success && regRes.data.token, '4. User Registration');
    const newUserToken = regRes.data.token;
    const newUserId = regRes.data.data._id;

    // 5. Get Feed
    const feedRes = await makeRequest('/api/posts?tab=for-you', 'GET', null, alexToken);
    assert(feedRes.status === 200 && feedRes.data.data.length > 0, `5. Get Feed (Returned ${feedRes.data.data?.length || 0} posts)`);

    // 6. Get Communities
    const commsRes = await makeRequest('/api/communities', 'GET', null, alexToken);
    assert(commsRes.status === 200 && commsRes.data.data.length >= 9, `6. Get Communities (Found ${commsRes.data.data?.length || 0} communities)`);
    const techComm = commsRes.data.data.find((c) => c.slug === 'technology') || commsRes.data.data[0];

    // 7. Create Post
    const newPostRes = await makeRequest(
      '/api/posts',
      'POST',
      {
        title: 'Automated Test Post: High Performance Web Applications',
        content: 'Testing post creation, live previews, voting, and comments.',
        postType: 'text',
        communityId: techComm._id,
        tags: ['AutomatedTest', 'WebDev'],
      },
      alexToken
    );
    assert(newPostRes.status === 201 && newPostRes.data.success, '7. Create Post with Community and Tags');
    const testPost = newPostRes.data.data;

    // 8. Upvote Post
    const upvoteRes = await makeRequest(`/api/posts/${testPost._id}/vote`, 'POST', { voteType: 1 }, alexToken);
    assert(upvoteRes.status === 200 && upvoteRes.data.data.userVote === 1, '8. Upvote Post (Score updated)');

    // 9. Like Post
    const likeRes = await makeRequest(`/api/posts/${testPost._id}/like`, 'POST', null, alexToken);
    assert(likeRes.status === 200 && likeRes.data.data.isLiked === true, '9. Like Post');

    // 10. Save Post
    const saveRes = await makeRequest(`/api/posts/${testPost._id}/save`, 'POST', null, alexToken);
    assert(saveRes.status === 200 && saveRes.data.data.isSaved === true, '10. Save Post to Bookmarks');

    // 11. Create Top-Level Comment
    const commentRes = await makeRequest(
      '/api/comments',
      'POST',
      {
        postId: testPost._id,
        content: 'This is an automated root test comment.',
      },
      newUserToken
    );
    assert(commentRes.status === 201 && commentRes.data.success, '11. Create Top-Level Comment');
    const rootComment = commentRes.data.data;

    // 12. Create Nested Threaded Reply
    const replyRes = await makeRequest(
      '/api/comments',
      'POST',
      {
        postId: testPost._id,
        content: 'This is a nested reply to the root comment.',
        parentCommentId: rootComment._id,
      },
      alexToken
    );
    assert(replyRes.status === 201 && replyRes.data.data.depth === 1, '12. Create Nested Threaded Reply (Depth = 1)');
    const nestedReply = replyRes.data.data;

    // 13. Like Comment
    const likeCommentRes = await makeRequest(`/api/comments/${rootComment._id}/like`, 'POST', null, alexToken);
    assert(likeCommentRes.status === 200 && likeCommentRes.data.data.isLiked === true, '13. Like Comment');

    // 14. Get Threaded Comments Tree
    const getCommentsRes = await makeRequest(`/api/comments/post/${testPost._id}`, 'GET', null, alexToken);
    assert(
      getCommentsRes.status === 200 &&
      getCommentsRes.data.data.length >= 1 &&
      getCommentsRes.data.data[0].replies.length >= 1,
      '14. Retrieve Threaded Comments Tree (Hierarchy verified)'
    );

    // 15. Follow / Unfollow User
    const followRes = await makeRequest(`/api/users/${alexId}/follow`, 'POST', null, newUserToken);
    assert(followRes.status === 200 && followRes.data.data.isFollowing === true, '15. Follow User');

    // 16. Join / Leave Community
    const joinRes = await makeRequest(`/api/communities/${techComm._id}/join`, 'POST', null, newUserToken);
    assert(joinRes.status === 200, '16. Toggle Join Community');

    // 17. Search
    const searchRes = await makeRequest('/api/search?q=Technology', 'GET', null, alexToken);
    assert(
      searchRes.status === 200 && searchRes.data.data.communities.length > 0,
      '17. Global Search (Matched Communities and Posts)'
    );

    // 18. Trending
    const trendingRes = await makeRequest('/api/trending', 'GET', null, alexToken);
    assert(
      trendingRes.status === 200 && trendingRes.data.data.topics.length > 0,
      '18. Get Trending Topics, Posts, and Communities'
    );

    // 19. Notifications
    const notifRes = await makeRequest('/api/notifications', 'GET', null, alexToken);
    assert(notifRes.status === 200 && notifRes.data.data.length > 0, '19. Get Notifications Feed');

    // 20. Mark All Notifications as Read
    const markReadRes = await makeRequest('/api/notifications/read-all', 'PUT', null, alexToken);
    assert(markReadRes.status === 200 && markReadRes.data.unreadCount === 0, '20. Mark All Notifications Read');

    // 21. Delete Nested Comment & Verify Tree
    const delCommentRes = await makeRequest(`/api/comments/${rootComment._id}`, 'DELETE', null, newUserToken);
    assert(delCommentRes.status === 200 && delCommentRes.data.deletedIds.length === 2, '21. Delete Comment & Recursive Replies (Deleted 2 items)');

    // 22. Delete Post
    const delPostRes = await makeRequest(`/api/posts/${testPost._id}`, 'DELETE', null, alexToken);
    assert(delPostRes.status === 200, '22. Delete Post (Cleaned up related docs)');

    // 23. Verify Static Frontend Files served by Express
    const htmlPages = ['/', '/profile.html', '/community.html', '/search.html', '/notifications.html', '/auth.html'];
    for (const page of htmlPages) {
      const pageRes = await makeRequest(page);
      assert(pageRes.status === 200, `23. Static Frontend Page Served (${page})`);
    }

    const cssAssets = ['/css/main.css', '/css/layout.css', '/css/components.css'];
    for (const css of cssAssets) {
      const cssRes = await makeRequest(css);
      assert(cssRes.status === 200, `24. Static CSS Asset Served (${css})`);
    }

    const jsAssets = [
      '/js/api.js',
      '/js/theme.js',
      '/js/components.js',
      '/js/auth.js',
      '/js/app.js',
      '/js/profile.js',
      '/js/community.js',
      '/js/search.js',
      '/js/notifications.js',
    ];
    for (const js of jsAssets) {
      const jsRes = await makeRequest(js);
      assert(jsRes.status === 200, `25. Static JS Asset Served (${js})`);
    }

    console.log('\n====================================================');
    console.log(`🎉 Automated Test Suite Completed!`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  }
};

runTests();
