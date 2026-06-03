import assert from "node:assert/strict";
import test from "node:test";
import { preprocessItemsForDisplay } from "../lib/display-preprocess.ts";
import type { Category, HotspotItem } from "../lib/types.ts";

function item(category: Category): HotspotItem {
  return {
    id: category + "-1",
    title: "Apple launches new AI model",
    summary: "Investors are watching the product cycle.",
    url: "https://example.com",
    source: "Example",
    category,
    publishedAt: "2026-05-28T00:00:00.000Z",
  };
}

test("translates tech and finance titles before display", async () => {
  const calls: string[] = [];
  const translate = async (text: string) => {
    calls.push(text);
    return "中文：" + text;
  };

  const [tech] = await preprocessItemsForDisplay("tech", [item("tech")], translate);
  const [finance] = await preprocessItemsForDisplay("finance", [item("finance")], translate);

  assert.equal(tech.title, "中文：Apple launches new AI model");
  assert.equal(tech.summary, "中文：Investors are watching the product cycle.");
  assert.equal(finance.title, "中文：Apple launches new AI model");
  assert.equal(finance.summary, "中文：Investors are watching the product cycle.");
  assert.deepEqual(calls, [
    "Apple launches new AI model",
    "Investors are watching the product cycle.",
    "Apple launches new AI model",
    "Investors are watching the product cycle.",
  ]);
});

test("keeps GitHub repository names intact while translating descriptions", async () => {
  const repo = {
    ...item("github"),
    title: "vercel/next.js",
    summary: "The React framework for the web.",
  };

  const [github] = await preprocessItemsForDisplay("github", [repo], async (text) => "中文：" + text);

  assert.equal(github.title, "vercel/next.js");
  assert.equal(github.summary, "中文：The React framework for the web.");
});
