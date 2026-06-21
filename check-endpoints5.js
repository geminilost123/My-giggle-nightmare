async function check(url) {
  const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify({model: "grok-imagine-video", prompt: "test", video: {"url": "https://test.com/v.mp4"}, duration: 6}) });
  console.log(url, res.status, await res.text());
}
check('https://api.x.ai/v1/videos/extensions');
