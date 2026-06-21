import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

async function check() {
  const cases = [
    { model: "grok-imagine-video", prompt: "test", video_url: "https://test.com/v.mp4" },
    { model: "grok-imagine-video", prompt: "test", source_video: "https://test.com/v.mp4" },
    { model: "grok-imagine-video", prompt: "test", video: "https://test.com/v.mp4" },
    { model: "grok-imagine-video", prompt: "test", video: { url: "https://test.com/v.mp4" } }
  ];

  for (let body of cases) {
    const res = await fetch("https://api.x.ai/v1/videos/extensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log(JSON.stringify(body));
    console.log(res.status, await res.text());
  }
}
check();
