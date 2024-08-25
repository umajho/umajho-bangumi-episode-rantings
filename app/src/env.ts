import { ReverseMap } from "./type-utils.ts";

const reversedKVPrefixes = {
  1: "users",
  2: "tokens",
  3: "token-coupons",
  4: "episode-infos",
  5: "user-subject-episode-rating-map",
  6: "subject-episode-score-votes",
} as const;
const kvPrefixes = Object.fromEntries(
  Object.entries(reversedKVPrefixes).map(([k, v]) => [v, Number(k)]),
) as ReverseMap<typeof reversedKVPrefixes>;

const env = {
  VALID_BGM_HOSTNAMES: [
    "bgm.tv",
    "bangumi.tv",
    "chii.in",
  ] as const,

  get ENTRYPOINT(): string {
    return Deno.env.get("ENTRYPOINT_URL")!;
  },

  buildURLAuthorizationCallback(callbackPath: string): string {
    return join(join(env.ENTRYPOINT, "auth/"), callbackPath);
  },

  PATH_API_REDEEM_TOKEN_COUPON: "/api/redeem_token_coupon",

  get PORT(): number {
    return Number(Deno.env.get("PORT")!);
  },

  get BGM_APP_ID(): string {
    return Deno.env.get("BGM_APP_ID")!;
  },

  get BGM_APP_SECRET(): string {
    return Deno.env.get("BGM_APP_SECRET")!;
  },

  get USER_AGENT(): string {
    return Deno.env.get("USER_AGENT")!;
  },

  get BGM_HOMEPAGE(): string {
    return Deno.env.get("BGM_HOMEPAGE_URL")!;
  },

  buildBGMURLOauthAuthorize(bgmBaseURL: string): string {
    return join(bgmBaseURL, "/oauth/authorize");
  },

  BGM_PATH_GADGET_CONFIRM: "/group/topic/404326",

  BGM_PATH_OAUTH_ACCESS_TOKEN: "/oauth/access_token",

  BGM_API_PATH_V0_EPISODES: "/v0/episodes",

  buildKVKeyUser(userID: number) {
    return [kvPrefixes["users"], userID] as const;
  },
  buildKVKeyToken(token: string) {
    return [kvPrefixes["tokens"], token] as const;
  },
  buildKVKeyTokenCoupon(tokenCoupon: string) {
    return [kvPrefixes["token-coupons"], tokenCoupon] as const;
  },
  buildKVKeyEpisodeInfo(episodeID: number) {
    return [kvPrefixes["episode-infos"], episodeID] as const;
  },
  buildKVKeyUserSubjectEpisodeRating(
    userID: number,
    subjectID: number,
    episodeID: number,
  ) {
    return [
      kvPrefixes["user-subject-episode-rating-map"],
      userID,
      subjectID,
      episodeID,
    ] as const;
  },
  buildKVKeySubjectEpisodeScoreVotes(
    subjectID: number,
    episodeID: number,
    score: number,
  ) {
    return [
      kvPrefixes["subject-episode-score-votes"],
      subjectID,
      episodeID,
      score,
    ] as const;
  },
  buildKVPrefixSubjectEpisodeScoreVotes(subjectID: number, episodeID: number) {
    return [
      kvPrefixes["subject-episode-score-votes"],
      subjectID,
      episodeID,
    ] as const;
  },
} as const;

function join(base: string, url: string): string {
  return (new URL(url, base)).href;
}

export default env;
