

## সমস্যা

ডেটাবেসের **প্রতিটি টেবিলে** সব RLS policy এখনও `RESTRICTIVE`। PostgreSQL-এ RESTRICTIVE policy কাজ করতে হলে অন্তত একটি PERMISSIVE policy থাকতে হয়। যেহেতু কোনো PERMISSIVE policy নেই, তাই কোনো operation-ই সফল হচ্ছে না।

## পরিকল্পনা

একটি single comprehensive migration তৈরি করবো যা **সব টেবিলের সব policy** drop করে PERMISSIVE হিসেবে recreate করবে।

### যে টেবিলগুলো ফিক্স করতে হবে (30+):

| Table | Policies to recreate |
|-------|---------------------|
| `likes` | SELECT (public), INSERT/DELETE (owner) |
| `comments` | SELECT (public), INSERT (owner), DELETE (owner + admin) |
| `follows` | SELECT (public), INSERT (owner, no self-follow), DELETE (owner) |
| `posts` | SELECT (public), INSERT/UPDATE/DELETE (owner), UPDATE/DELETE (admin) |
| `profiles` | SELECT (public), INSERT/UPDATE (owner), UPDATE (admin) |
| `chats` | SELECT/UPDATE (participant), INSERT (participant), admin/super_admin |
| `messages` | SELECT (participant), INSERT (sender in chat), admin |
| `notifications` | SELECT/UPDATE (owner), INSERT (owner) |
| `reels` | SELECT (public), INSERT/UPDATE/DELETE (owner), DELETE (admin) |
| `reel_likes` | SELECT (public), INSERT/DELETE (owner) |
| `reel_comments` | SELECT (public), INSERT/DELETE (owner) |
| `groups` | SELECT (public/private), INSERT (creator), UPDATE/DELETE (group admin), platform admin |
| `group_members` | SELECT (public), INSERT/DELETE (owner), UPDATE/DELETE (group admin) |
| `group_posts` | SELECT (members/public), INSERT (approved members), DELETE (owner + admin) |
| `pages` | SELECT (public), INSERT/UPDATE/DELETE (creator), admin |
| `page_followers` | SELECT (public), INSERT/DELETE (owner) |
| `page_posts` | SELECT (public), INSERT (page creator), DELETE (owner) |
| `services` | SELECT (active), INSERT/UPDATE/DELETE (provider), admin |
| `reviews` | SELECT (public), INSERT (reviewer) |
| `calls` | SELECT (participant + admin), INSERT (caller) |
| `disputes` | SELECT (participant + admin), INSERT (complainant), UPDATE (admin) |
| `home_services` | SELECT (active), INSERT/UPDATE/DELETE (provider), admin |
| `home_bookings` | SELECT (participant), INSERT (customer), UPDATE (customer/provider), admin |
| `home_service_categories` | SELECT (public) |
| `live_channels` | SELECT (active), admin |
| `m3u_sources` | admin only |
| `payment_requests` | SELECT (owner + admin), INSERT (owner), UPDATE (admin) |
| `wallet_transactions` | owner only |
| `ad_views` | INSERT/SELECT (owner) |
| `app_settings` | SELECT (public), ALL (admin) |
| `badges` | SELECT (public) |
| `points_redemptions` | SELECT/INSERT (owner) |
| `push_subscriptions` | ALL (owner), SELECT (public for service role) |
| `self_ads` | owner + admin |

### পদ্ধতি

প্রতিটি টেবিলের জন্য:
1. `DROP POLICY IF EXISTS "..." ON public.table_name;` — সব existing policy drop
2. `CREATE POLICY "..." ON public.table_name AS PERMISSIVE ...` — সব policy PERMISSIVE হিসেবে recreate

4 টি batch migration ফাইলে ভাগ করে execute করবো (SQL size limit এর জন্য)।

### কোড পরিবর্তন
কোনো frontend code change লাগবে না — শুধু database migration।

