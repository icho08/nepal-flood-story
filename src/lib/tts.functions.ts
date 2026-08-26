import { createServerFn } from "@tanstack/react-start";
import { CHAPTERS } from "./narration";

export const getNarrationAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const id = (data as { chapterId?: unknown })?.chapterId;
    if (typeof id !== "string" || !CHAPTERS.some((c) => c.id === id)) {
      throw new Error("Unknown chapter");
    }
    return { chapterId: id };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const chapter = CHAPTERS.find((c) => c.id === data.chapterId)!;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: chapter.narration,
        voice: "onyx",
        response_format: "mp3",
        instructions:
          "Calm, measured male documentary narrator. Serious and factual, unhurried, with clear pauses between sentences.",
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Narration unavailable (${res.status}): ${message}`);
    }

    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return { audio: btoa(binary) };
  });
