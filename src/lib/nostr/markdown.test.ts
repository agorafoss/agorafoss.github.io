import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown.ts";

describe("safe markdown", () => {
  it("escapes html and allows a few marks", () => {
    expect(renderMarkdown("oi <script>")).toContain("&lt;script&gt;");
    expect(renderMarkdown("fala **alto**")).toContain("<strong>alto</strong>");
    expect(renderMarkdown("use `code`")).toContain("<code>code</code>");
    expect(renderMarkdown("veja https://agora.local")).toContain('href="https://agora.local"');
  });

  it("renders a blossom image without linkifying the src", () => {
    const url = "https://blossom.primal.net/26719172fc89c82402bf644708f9fab835aa62bb6f60ef3640ec855fa5090deb.png";
    const html = renderMarkdown(url);
    expect(html).toContain(`<img src="${url}"`);
    expect(html).not.toContain("<a href=");
    expect(html).not.toMatch(/png" alt="" \/>$/);
    expect(html.split("<img").length - 1).toBe(1);
  });

  it("renders video urls as a player and keeps plain links as anchors", () => {
    expect(renderMarkdown("https://files.example/clip.webm")).toContain("<video src=");
    expect(renderMarkdown("leia https://agora.local/docs")).toContain('href="https://agora.local/docs"');
  });

  it("renders audio urls as a player", () => {
    const html = renderMarkdown("https://blossom.primal.net/nota.mp3");
    expect(html).toContain("<audio src=");
    expect(html).not.toContain("<a href=");
  });
});
