import { Hono } from "jsr:@hono/hono";

import ENDPOINT_PATHS from "../../shared/endpoint-paths.ts";

import * as Middlewares from "../../middlewares/mod.ts";
import { generateToken } from "../../utils.ts";
import { UserID } from "../../types.ts";
import { respondForAPI, respondWithError } from "../../responding.tsx";
import env from "../../env.ts";
import * as Global from "../../global.ts";

export const router = new Hono();
export default router;

router.get(
  `/${ENDPOINT_PATHS.AUTH.BANGUMI_PAGE}`,
  Middlewares.referrers(),
  // deno-lint-ignore require-await
  async (ctx) => {
    if (!ctx.var.referrerHostname) throw new Error("TODO: handle this!");

    const gadgetVersion = ctx.req.query("gadget_version");

    const url = new URL(
      env.buildBGMURLOauthAuthorize(ctx.var.referrerHostname),
    );
    url.searchParams.set("client_id", env.BGM_APP_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "redirect_uri",
      env.buildURLAuthorizationCallback(ENDPOINT_PATHS.AUTH.CALLBACK),
    );
    url.searchParams.set(
      "state",
      JSON.stringify({ gadgetVersion }),
    );

    return ctx.redirect(url.toString());
  },
);

router.get(
  `/${ENDPOINT_PATHS.AUTH.CALLBACK}`,
  Middlewares.referrers(),
  Middlewares.gadgetVersion(),
  async (ctx) => {
    if (!ctx.var.referrerHostname) throw new Error("TODO: handle this!");

    const state = JSON.parse(ctx.req.query("state")!);
    ctx.set("gadgetVersion", state.gadgetVersion);

    const code = ctx.req.query("code")!;

    const data = await Global.bangumiClient.postToGetAccessToken({
      clientID: env.BGM_APP_ID,
      clientSecret: env.BGM_APP_SECRET,
      code,
      redirectURI: env.buildURLAuthorizationCallback(
        ENDPOINT_PATHS.AUTH.CALLBACK,
      ),
    });

    const userIDRaw = data["user_id"];
    if (!/^\d+$/.test(userIDRaw)) {
      return respondWithError(
        ctx,
        "BAD_USER_ID",
        `用户 ID 应该是整数，但从 bangumi 那边得到的却是 “${userIDRaw}”`,
        { isForAPI: false },
      );
    }
    const userID = Number(userIDRaw) as UserID;
    const userToken = generateToken(userID);
    const userTokenCoupon = generateToken(userID);

    let isOk = false;
    while (!isOk) {
      const userResult = await Global.repo.getUserResult(userID);
      const user = userResult.value ?? { tokens: [] };

      const result = await Global.repo.tx((tx) => {
        if (user.tokens.length >= 10) {
          // 用户持有的 tokens 太多了。目前也懒得去实现记录各个 token 的使用频率/最
          // 后使用时间，直接去掉最早的那个对用户而言也有些不可预测（至少我不会记得
          // 自己 tokens 的生成顺序），干脆就一股脑全清掉了。

          for (const token of user.tokens) {
            tx.deleteTokenEntry(token);
          }
          user.tokens = [];
        }

        user.tokens.push(userToken);

        tx.setUser(userID, user, userResult);
        tx.setTokenEntry(userToken, { userID });
        tx.setTokenCouponEntry(userTokenCoupon, { token: userToken });
      });
      isOk = result.ok;
    }

    const url = new URL(
      env.BGM_PATH_GADGET_CONFIRM,
      ctx.var.referrerHostname,
    );
    url.searchParams.set("bgm_ep_ratings_token_coupon", userTokenCoupon);
    if (!ctx.var.gadgetVersion) { // 兼容可能在旧版本组件中存在的错误。
      url.searchParams.set("bgm_test_app_token_coupon", userTokenCoupon);
    }

    return ctx.redirect(url.toString());
  },
);

router.post(
  `/${ENDPOINT_PATHS.AUTH.REDEEM_TOKEN_COUPON}`,
  Middlewares.setIsForAPI(),
  async (ctx) => {
    const { tokenCoupon } = await ctx.req.json();

    const token = await Global.repo.popTokenCouponEntryToken(tokenCoupon);

    return respondForAPI(ctx, ["ok", token]);
  },
);
