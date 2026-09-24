(() => {
  "use strict";
  const API = "/api/chat";
  const MAX_TURNS = 8;
  const FALLBACK_WA = "2340000000000";
  const history = [];

  // ---- styles (injected once; CSP allows 'unsafe-inline' for styles only) ----
  const css = `
  #dk-bubble{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;background:#0b7a4b;color:#fff;border:0;font-size:24px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:9999}
  #dk-panel{position:fixed;right:20px;bottom:88px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:70vh;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none;flex-direction:column;font:14px/1.4 system-ui,sans-serif;z-index:9999;overflow:hidden}
  #dk-panel.open{display:flex}
  #dk-head{background:#0b7a4b;color:#fff;padding:12px 14px;font-weight:600}
  #dk-log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f6f7f8}
  .dk-msg{max-width:85%;padding:8px 11px;border-radius:10px;white-space:pre-wrap;word-wrap:break-word}
  .dk-user{align-self:flex-end;background:#0b7a4b;color:#fff}
  .dk-bot{align-self:flex-start;background:#fff;border:1px solid #e3e5e8}
  .dk-typing{align-self:flex-start;color:#777;font-style:italic}
  .dk-wa{align-self:flex-start;display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:600}
  #dk-form{display:flex;border-top:1px solid #e3e5e8}
  #dk-input{flex:1;border:0;padding:12px;font:inherit;outline:none}
  #dk-send{border:0;background:#0b7a4b;color:#fff;padding:0 16px;cursor:pointer;font:inherit}
  #dk-send:disabled{opacity:.5;cursor:default}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- DOM (built with createElement; no innerHTML anywhere) ----
  const el = (tag, props = {}, text) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const bubble = el("button", { id: "dk-bubble", type: "button", title: "Chat with us" }, "💬");
  const panel = el("div", { id: "dk-panel" });
  const head = el("div", { id: "dk-head" }, "DELAKLEAN assistant");
  const log = el("div", { id: "dk-log" });
  const form = el("form", { id: "dk-form" });
  const input = el("input", { id: "dk-input", type: "text", maxLength: 500, placeholder: "Ask about our cleaning services…", autocomplete: "off" });
  const send = el("button", { id: "dk-send", type: "submit" }, "Send");
  form.append(input, send);
  panel.append(head, log, form);
  document.body.append(bubble, panel);

  const addMsg = (text, cls) => {
    const m = el("div", { className: `dk-msg ${cls}` }, text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };
  const addWhatsApp = (number) => {
    const last = history.filter((t) => t.role === "user").slice(-1)[0]?.text ?? "";
    const prefill = encodeURIComponent(`Hello DELAKLEAN, I was chatting on your website about: ${last}`);
    const a = el("a", { className: "dk-wa", href: `https://wa.me/${number}?text=${prefill}`, target: "_blank", rel: "noopener noreferrer" }, "Continue on WhatsApp");
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
  };

  bubble.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) {
      if (!log.childElementCount) addMsg("Hi! Ask me about DELAKLEAN's cleaning services.", "dk-bot");
      input.focus();
    }
  });

  // ---- YOUR PART: talk to the function ----
  async function sendMessage(text) {
    addMsg(text, "dk-user");
    history.push({ role: "user", text });
    const typing = addMsg("typing…", "dk-typing");
    send.disabled = true;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-MAX_TURNS) }),
      });
      const data = await res.json();
      typing.remove();

      addMsg(data.reply, "dk-bot");
      history.push({ role: "model", text: data.reply });
      if (data.handoff === true) addWhatsApp(data.whatsapp || FALLBACK_WA);
    } catch {
      typing.remove();
      addMsg("Sorry, something went wrong. Please reach us on WhatsApp.", "dk-bot");
      addWhatsApp(FALLBACK_WA);
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = "";
    sendMessage(text);
  });
})();