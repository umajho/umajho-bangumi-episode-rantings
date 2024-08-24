import { client, token } from "../global";

export function renderDebug(el: HTMLElement) {
  $(el).html(/*html*/ `
    <div style="display: flex; flex-direction: column">
      <a data-sel="auth-link" class="l">
          将我的 Bangumi 账户关联至 Test 应用。
        </a>
      <p data-sel="whoami">whoami: {me()}</p>
    </div>
  `);

  $(el).find("[data-sel=auth-link]").attr("href", client.URL_AUTH_BANGUMI_PAGE);

  function renderWhoami(me: string) {
    $(el).find("[data-sel=whoami]").text(`whoami: ${me}`);
  }
  renderWhoami("…");

  token.watch(async () => {
    const userID = await client.whoami();
    renderWhoami(userID ? `${userID}` : "未登录");
  });
}
