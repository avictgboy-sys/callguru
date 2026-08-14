import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import searchServices from "./tools/search-services";
import listMyCalls from "./tools/list-my-calls";
import listWalletTransactions from "./tools/list-wallet-transactions";
import listMyNotifications from "./tools/list-my-notifications";
import createPost from "./tools/create-post";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "callguru",
  title: "callguru",
  version: "0.1.0",
  instructions:
    "Tools for CallGuru, a marketplace for live expert video consultations. Use `get_my_profile` for the signed-in user's account, wallet balance and points; `search_services` to find experts and their per-minute rates; `list_my_calls` for consultation history; `list_wallet_transactions` for money movements; `list_my_notifications` for alerts; and `create_post` to publish to the social feed. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    searchServices,
    listMyCalls,
    listWalletTransactions,
    listMyNotifications,
    createPost,
  ],
});
