import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import fs from "fs";

async function check() {
  const apiKey = process.env.XAI_API_KEY || "YOUR_TEST_KEY_IF_ANY"; 
  // Let me just look at the response schema without auth if possible? Oh wait.
  // We can't hit it. I'll read the API docs.
}
