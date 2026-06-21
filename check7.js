import fetch from "node-fetch";

async function check() {
  const cases = [
    { model: "grok-imagine-video", prompt: "test text", duration: 6, video_url: "https://test.com/v.mp4" },
    { model: "grok-imagine-video", prompt: "test text", duration: 6, source_video: "https://test.com/v.mp4" },
    { model: "grok-imagine-video", prompt: "test text", duration: 6, video: { url: "https://test.com/v.mp4" } }
  ];

  for (let body of cases) {
    const res = await fetch("https://api.x.ai/v1/videos/extensions", {
      method: "POST",
      headers: { "Authorization": "Bearer test", "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log(JSON.stringify(body), res.status, await res.text());
  }
}
check();
