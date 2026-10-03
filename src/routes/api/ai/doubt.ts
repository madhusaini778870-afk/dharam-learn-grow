import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

type Body = {
  courseId?: string;
  courseTitle?: string | null;
  subjectName?: string | null;
  chapterTitle?: string | null;
  lessonId?: string;
  lessonTitle?: string;
  lessonContext?: string | null;
  timestampSeconds?: number | null;
  question?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/ai/doubt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const lovableKey = process.env["LOVABLE_API_KEY"];
        const geminiKey = process.env["GEMINI_API_KEY"];

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

        // If user has token and Supabase is configured, verify session
        if (token && supabaseUrl && publishableKey) {
          try {
            const authClient = createClient(supabaseUrl, publishableKey, {
              auth: { persistSession: false },
              global: {
                fetch: (input, init) => {
                  const headers = new Headers(init?.headers);
                  if (publishableKey.startsWith("sb_")) headers.delete("Authorization");
                  headers.set("apikey", publishableKey);
                  if (publishableKey.startsWith("sb_"))
                    headers.set("Authorization", `Bearer ${token}`);
                  return fetch(input, { ...init, headers });
                },
              },
            });
            const { data: userData, error: userError } = await authClient.auth.getUser(token);
            if (userError || !userData.user) {
              return json({ error: "Your session has expired. Please sign in again." }, 401);
            }
          } catch {
            // Proceed in guest mode
          }
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ error: "Invalid request body." }, 400);
        }

        const question = body.question?.trim();
        if (!question) return json({ error: "Please type a question." }, 400);
        if (!geminiKey && !lovableKey) {
          return json({ error: "The AI service is not configured." }, 500);
        }

        const contextLines = [
          body.courseTitle
            ? `Course: ${body.courseTitle}`
            : body.courseId
              ? `Course id: ${body.courseId}`
              : null,
          body.subjectName ? `Subject: ${body.subjectName}` : null,
          body.chapterTitle ? `Chapter: ${body.chapterTitle}` : null,
          body.lessonTitle ? `Lecture title: ${body.lessonTitle}` : null,
          body.lessonId ? `Lecture id: ${body.lessonId}` : null,
          typeof body.timestampSeconds === "number"
            ? `Current video timestamp: ${Math.floor(body.timestampSeconds)}s`
            : null,
          body.lessonContext
            ? `Authorized lesson context:\n${body.lessonContext}`
            : "Lesson context: none supplied.",
        ]
          .filter(Boolean)
          .join("\n");

        const systemPrompt = [
          "You are the AI Doubt Solver inside Dharam Bhai Study, a premier JEE/NEET exam-prep app.",
          "Answer strictly using the lesson context supplied below plus standard, well-established physics, chemistry, biology and maths concepts.",
          "If the lesson context is missing or insufficient to answer the specific question about this lesson, reply plainly that you do not have enough information from this lesson, and do not invent lesson details, teacher names, timings or content.",
          "Never invent course, batch, teacher, price or schedule information.",
          "Be concise, clear and encouraging. Use short, legible numbered steps for mathematical and physical derivations.",
        ].join(" ");

        // Prefer native Gemini API when GEMINI_API_KEY is present
        if (geminiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });

            const contents = [
              ...(body.history ?? []).map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
              })),
              { role: "user", parts: [{ text: question }] },
            ];

            const response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents,
              config: {
                systemInstruction: `${systemPrompt}\n\n${contextLines}`,
              },
            });

            const answer = response.text?.trim();
            if (!answer) return json({ error: "The AI service returned an empty answer." }, 502);
            return json({ answer });
          } catch (err) {
            console.error("Gemini API error:", err);
            // Fall through to Lovable gateway if available
            if (!lovableKey) {
              return json(
                { error: "Failed to generate AI doubt explanation. Please try again." },
                502,
              );
            }
          }
        }

        // Fallback to Lovable AI gateway
        if (lovableKey) {
          try {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${lovableKey}`,
              },
              body: JSON.stringify({
                model: "google/gemini-3.8-flash",
                messages: [
                  { role: "system", content: `${systemPrompt}\n\n${contextLines}` },
                  ...(body.history ?? []).map((message) => ({
                    role: message.role,
                    content: message.content,
                  })),
                  { role: "user", content: question },
                ],
              }),
            });

            const payload = (await response.json().catch(() => null)) as {
              choices?: { message?: { content?: string } }[];
              error?: { message?: string };
            } | null;

            if (!response.ok) {
              const message =
                payload?.error?.message ??
                (response.status === 429
                  ? "Too many questions right now. Please wait a moment and try again."
                  : response.status === 402
                    ? "The AI service has run out of credits. Please contact the app owner."
                    : "The AI service returned an error.");
              return json({ error: message }, response.status);
            }

            const answer = payload?.choices?.[0]?.message?.content?.trim();
            if (!answer) return json({ error: "The AI service returned an empty answer." }, 502);
            return json({ answer });
          } catch {
            return json({ error: "Could not reach the AI service. Please try again." }, 502);
          }
        }

        return json({ error: "AI service unavailable." }, 503);
      },
    },
  },
});
