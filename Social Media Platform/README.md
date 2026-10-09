# ConnectHub 🚀

**ConnectHub** is a next-generation mini social media and community web application that bridges Facebook-style rich profiles, personalized feeds, and follows with Reddit-style community sub-spaces, upvoting/downvoting, and multi-level nested threaded discussions.

---

## 🌟 Key Features

1. **Authentication & Security**:
   - JWT-based authentication with Bearer tokens stored in localStorage.
   - Secure password hashing with `bcryptjs`.
   - 1-Click Instant Demo login buttons for instant testing.
   - Simulated Forgot Password dialog flow.

2. **Rich Profiles & Social Graph**:
   - Cover photos, custom avatars, bio, location, join dates.
   - Dynamic real-time counters (Followers, Following, Posts).
   - Follow/Unfollow toggle mechanism.
   - Activity tabs: **Posts**, **Comments**, **Liked Posts**, **Saved Bookmarks**.
   - Interactive modal listing Followers and Following.
   - Profile editor with live updates.

3. **Community Hubs**:
   - 9 built-in communities: **Technology**, **Programming**, **Gaming**, **Movies**, **Education**, **AI**, **Sports**, **Memes**, **College Life**.
   - Community banners, category badges, rules list, member lists, and creator attribution.
   - Join / Leave toggles.
   - Community tabs: **Discussions**, **Popular**, **New**, **Top Voted**, **About Community**.
   - Create Community modal.

4. **Dynamic Feed & Rich Posts**:
   - Feed filter tabs: **For You** (personalized algorithm), **Following**, **Joined Communities**, **Popular**, **New**, **Top Voted**.
   - Multi-format post creation: **Text discussions**, **Image posts** (with upload and URL support), and **External link cards**.
   - Live real-time preview card before publishing.
   - Tags support (e.g. `#JavaScript`, `#WebDev`, `#AI`).
   - Reddit-style Upvote/Downvote voting pill with dynamic live score.
   - Facebook-style Likes with animated heart.
   - Post bookmarking / saving.
   - Share button (copies direct link to clipboard).
   - Author-only post deletion.

5. **Multi-Level Threaded Comments**:
   - Full tree hierarchy with indentation guide lines and depth levels.
   - Inline reply drawers with depth tracking.
   - Comment likes with count.
   - Recursive deletion (deleting a comment cleanly removes all of its nested descendant replies).

6. **Search & Discovery**:
   - Top navbar debounced global search with quick dropdown previews.
   - Dedicated Search & Explore page with category tabs (**All**, **Communities**, **People**, **Posts**).
   - Right sidebar widgets featuring **Trending Topics**, **Suggested People**, and **Top Communities**.

7. **Notifications System**:
   - Real-time alerts for likes, votes, comments, replies, and new followers.
   - Live badge counter on top navbar.
   - Notification tabs: **All**, **Unread**, **Likes & Votes**, **Comments & Replies**, **Follows**.
   - Mark single / Mark all as read.

8. **Design System & Responsiveness**:
   - Pure Vanilla CSS design system with custom HSL color tokens and glassmorphism.
   - Dark mode (default) and Light mode toggle with localStorage persistence.
   - Responsive 3-column desktop layout, collapsible sidebars, and Mobile Bottom Navigation Bar (for screens &lt; 768px).

---

## 🛠️ Technology Stack

- **Frontend**: HTML5 Semantic Structure, Vanilla JavaScript (ES6+ Fetch API), Vanilla CSS3 (Custom Design System, Flexbox, CSS Grid, Glassmorphic backdrop filters, Bootstrap Icons).
- **Backend**: Node.js, Express 4 (CommonJS), Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `multer`, `cors`, `dotenv`.
- **Database**: MongoDB with automatic embedded fallback to `mongodb-memory-server` (Zero prerequisite installation required!).

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Seed Database (Optional - Server auto-seeds on first run)
```bash
npm run seed
```

### 3. Start the Application
```bash
npm start
```
Open **http://localhost:5000** in your browser.

---

## 👥 Demo User Accounts

All demo accounts use password: **`Password@123`**

| Full Name | Username | Email | Role / Bio |
| :--- | :--- | :--- | :--- |
| **Alex Kumar** | `@alexkumar` | `alex@connecthub.com` | Full-stack builder, open-source enthusiast |
| **Priya Sharma** | `@priyasharma` | `priya@connecthub.com` | AI researcher & product designer |
| **Rahul Dev** | `@rahuldev` | `rahul@connecthub.com` | Game developer & 3D artist |
| **Sarah Thomas** | `@sarahthomas` | `sarah@connecthub.com` | Cinema curator, screenwriter, essayist |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Log in with email/username and password |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email |

### Users (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/:username` | Public | Get user profile and stats |
| `PUT` | `/api/users/profile` | Private | Update authenticated user profile |
| `POST` | `/api/users/:id/follow` | Private | Toggle follow/unfollow user |
| `GET` | `/api/users/:username/followers`| Public | List user followers |
| `GET` | `/api/users/:username/following`| Public | List users followed |
| `GET` | `/api/users/suggested` | Public | Get suggested users to follow |
| `GET` | `/api/users/:username/posts` | Public | Get user authored posts |
| `GET` | `/api/users/:username/comments`| Public | Get user comments |
| `GET` | `/api/users/:username/liked` | Public | Get posts liked by user |
| `GET` | `/api/users/saved` | Private | Get authenticated user saved posts |

### Posts (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | Get filtered feed (`tab`, `tag`, `page`, `limit`) |
| `POST` | `/api/posts` | Private | Create new post (Text, Image, Link) |
| `GET` | `/api/posts/:id` | Public | Get single post details |
| `DELETE`| `/api/posts/:id` | Private | Delete own post |
| `POST` | `/api/posts/:id/like` | Private | Toggle like on post |
| `POST` | `/api/posts/:id/vote` | Private | Upvote (`1`) / Downvote (`-1`) post |
| `POST` | `/api/posts/:id/save` | Private | Toggle save post to bookmarks |

### Comments (`/api/comments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/comments/post/:postId` | Public | Get nested threaded comment tree |
| `POST` | `/api/comments` | Private | Create root comment or nested reply |
| `POST` | `/api/comments/:id/like` | Private | Toggle like on comment |
| `DELETE`| `/api/comments/:id` | Private | Delete comment & recursive replies |

### Communities (`/api/communities`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/communities` | Public | List & search communities |
| `POST` | `/api/communities` | Private | Create new community |
| `GET` | `/api/communities/:slug` | Public | Get community metadata and stats |
| `GET` | `/api/communities/:slug/posts` | Public | Get community posts by tab |
| `GET` | `/api/communities/:slug/members`| Public | Get community member list |
| `POST` | `/api/communities/:id/join` | Private | Toggle join/leave community |

### Notifications & Search (`/api/notifications`, `/api/search`, `/api/trending`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Private | List notifications by filter |
| `PUT` | `/api/notifications/read-all` | Private | Mark all notifications as read |
| `PUT` | `/api/notifications/:id/read` | Private | Mark single notification as read |
| `GET` | `/api/search?q=...` | Public | Global search across users, posts, communities |
| `GET` | `/api/trending` | Public | Get trending topics, posts, and communities |
| `POST` | `/api/upload` | Private | Upload image file |
