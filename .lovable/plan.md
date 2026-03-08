

# Reels Feature Plan

## Overview
Instagram/Facebook-style vertical short video feed (Reels) — full-screen swipeable videos with like, comment, share interactions.

## Database Changes

**New `reels` table:**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `video_url` (text, NOT NULL)
- `caption` (text, nullable)
- `thumbnail_url` (text, nullable)
- `likes_count` (int, default 0)
- `comments_count` (int, default 0)
- `views_count` (int, default 0)
- `created_at` (timestamptz, default now())

**New `reel_likes` table:**
- `id` (uuid, PK)
- `reel_id` (uuid, NOT NULL, FK → reels)
- `user_id` (uuid, NOT NULL)
- `created_at` (timestamptz)
- Unique constraint on (reel_id, user_id)

**New `reel_comments` table:**
- `id` (uuid, PK)
- `reel_id` (uuid, NOT NULL, FK → reels)
- `user_id` (uuid, NOT NULL)
- `content` (text, NOT NULL)
- `created_at` (timestamptz)

**RLS policies:** Public SELECT on reels, authenticated INSERT/DELETE own. Same pattern for likes/comments as existing tables.

## New Files

1. **`src/pages/Reels.tsx`** — Full-screen vertical swipeable reel viewer
   - TikTok/Instagram Reels-style UI: full viewport height, snap scrolling
   - Each reel shows video, author info overlay, like/comment/share buttons on right side
   - Swipe up/down to navigate between reels
   - Auto-play current reel, pause others
   - Bottom sheet for comments

2. **`src/hooks/useReels.ts`** — Data hooks
   - `useReels()` — fetch reels with author profiles
   - `useCreateReel()` — upload reel
   - `useToggleReelLike()` — like/unlike
   - `useReelComments()` / `useCreateReelComment()`

3. **`src/components/reels/ReelCard.tsx`** — Single reel component with video player, overlay UI
4. **`src/components/reels/ReelComments.tsx`** — Bottom sheet comments drawer
5. **`src/components/reels/CreateReelDialog.tsx`** — Dialog to upload a new reel (video URL + caption)

## Route & Navigation Updates

- **`App.tsx`**: Add `/reels` route (protected)
- **`Feed.tsx`**: Update "Watch" nav item (`PlayCircle`) to link to `/reels` instead of `/feed`
- **Mobile bottom nav**: Update `PlayCircle` link to `/reels`

## UI Design

- Full-screen black background, snap scroll (`scroll-snap-type: y mandatory`)
- Right side floating buttons: Heart, Comment, Share, Music icon
- Bottom overlay: Author avatar + name, caption text
- Progress bar at top showing video position
- Mobile-first but works on desktop (centered max-width container)

## Technical Details

- Videos play via HTML5 `<video>` with IntersectionObserver for auto-play/pause
- CSS scroll-snap for smooth vertical navigation
- Framer Motion for like animation (heart burst)
- Video URL input (not file upload) to keep it simple initially

