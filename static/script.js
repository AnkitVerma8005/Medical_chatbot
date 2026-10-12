const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clear");
let busy = false;

const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#0e6b68" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SUGGESTIONS = [
  "What are the symptoms of diabetes?",
  "How is high blood pressure treated?",
  "What causes migraines?"
];

function showIntro() {
  chat.innerHTML = "";
  const box = document.createElement("div");
  box.className = "intro";
  box.innerHTML =
    "<h2>What would you like to know?</h2>" +
    "<p>Ask about conditions, symptoms or treatments. Answers come from the documents loaded into this chatbot.</p>";
  const chips = document.createElement("div");
  chips.className = "chips";
  SUGGESTIONS.forEach(function (text) {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", function () { send(text); });
    chips.appendChild(b);
  });
  box.appendChild(chips);
  chat.appendChild(box);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Tiny, safe markdown: **bold**, bullet lists, paragraphs
function renderMarkdown(text) {
  const lines = escapeHtml(text).split("\n");
  let html = "", inList = false;
  lines.forEach(function (line) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const inline = function (s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); };
    if (bullet) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += "<li>" + inline(bullet[1]) + "</li>";
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim()) html += "<p>" + inline(line) + "</p>";
    }
  });
  if (inList) html += "</ul>";
  return html;
}

function addMessage(role, content, isError) {
  const intro = chat.querySelector(".intro");
  if (intro) intro.remove();

  const row = document.createElement("div");
  row.className = "msg " + role + (isError ? " error" : "");
  const body = document.createElement("div");
  body.className = "body";

  if (role === "user") {
    body.textContent = content;
    row.appendChild(body);
  } else {
    const av = document.createElement("div");
    av.className = "avatar";
    av.innerHTML = ICON;
    row.appendChild(av);
    if (content === null) {
      body.innerHTML = '<span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span>';
    } else {
      body.innerHTML = renderMarkdown(content);
    }
    row.appendChild(body);
  }
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return row;
}

function setBusy(state) {
  busy = state;
  input.disabled = state;
  sendBtn.disabled = state || !input.value.trim();
}

async function send(text) {
  text = (text || input.value).trim();
  if (!text || busy) return;

  addMessage("user", text);
  input.value = "";
  resize();
  setBusy(true);
  const pending = addMessage("bot", null);

  try {
    const res = await fetch("/get", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ msg: text })
    });
    if (!res.ok) throw new Error("Server returned " + res.status);
    if (!res.body) throw new Error("Streaming is not supported by this browser.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const body = pending.querySelector(".body");
    let buffer = "";
    let answer = "";
    let finished = false;

    function handleEvent(block) {
      let event = "message";
      const data = [];
      block.split("\n").forEach(function (line) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
      });
      if (!data.length) return;

      const value = JSON.parse(data.join("\n"));
      if (event === "token") {
        answer += value;
        body.innerHTML = renderMarkdown(answer);
        chat.scrollTop = chat.scrollHeight;
      } else if (event === "error") {
        throw new Error(value);
      } else if (event === "done") {
        finished = true;
      }
    }

    while (true) {
      const result = await reader.read();
      buffer += decoder.decode(result.value, { stream: !result.done });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        handleEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (result.done) {
        if (buffer.trim()) handleEvent(buffer);
        break;
      }
    }
    if (!finished) throw new Error("The response stream ended unexpectedly.");
  } catch (err) {
    pending.classList.add("error");
    pending.querySelector(".body").textContent = err.message;
  } finally {
    setBusy(false);
    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }
}

function resize() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
}

input.addEventListener("input", function () {
  resize();
  sendBtn.disabled = busy || !input.value.trim();
});
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
sendBtn.addEventListener("click", function () { send(); });
clearBtn.addEventListener("click", function () { if (!busy) { showIntro(); input.focus(); } });

showIntro();
input.focus();