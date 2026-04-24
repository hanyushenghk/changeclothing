import { Resend } from "resend";

import { WelcomeEmail } from "@/emails/welcome";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const welcomeFrom = process.env.WELCOME_EMAIL_FROM?.trim() || "Paper Plane <hello@hkcompass.org>";
const welcomeReplyTo = process.env.WELCOME_EMAIL_REPLY_TO?.trim() || "support@hkcompass.org";
const dailyFrom = process.env.DAILY_LETTER_FROM?.trim() || welcomeFrom;
const dailyReplyTo = process.env.DAILY_LETTER_REPLY_TO?.trim() || welcomeReplyTo;
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://your-domain.com";

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const result = await resend.emails.send({
    from: welcomeFrom,
    to: userEmail,
    replyTo: welcomeReplyTo,
    subject: "Welcome to Paper Plane",
    text: [
      `Hi ${userName}, welcome to Paper Plane.`,
      "",
      "Your account has been created successfully.",
      "You received this email because you just signed up with this address.",
      "",
      "If this was not you, please ignore this email.",
      "",
      "— The Paper Boyfriend Team",
    ].join("\n"),
    react: WelcomeEmail({ userName }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }

  return result.data;
}

export async function generateLoveLetter(userName: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.DAILY_LOVE_MODEL?.trim() || "gemini-1.5-flash";

  if (!apiKey) {
    return `Good morning, ${userName}. Wishing you a focused and productive day.`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Write one short warm good-morning message in English for ${userName}. Keep it under 40 words and safe for work.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new Error("Gemini returned empty text");
    }

    return text;
  } catch {
    return `Good morning, ${userName}. Wishing you a focused and productive day.`;
  }
}

export async function sendDailyLoveLetter(userEmail: string, userName: string) {
  const loveLetter = await generateLoveLetter(userName);

  const result = await resend.emails.send({
    from: dailyFrom,
    to: userEmail,
    replyTo: dailyReplyTo,
    subject: `Good morning ${userName}, thinking of you today`,
    text: [
      loveLetter,
      "",
      "Start your workday here:",
      appUrl,
      "",
      "— Paper Plane",
    ].join("\n"),
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <p>${loveLetter}</p>
        <br/>
        <p>— Paper Plane</p>
        <p style="color: #999; font-size: 12px;">
          Want to continue working? <a href="${appUrl}">Return here</a>
        </p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }

  return result.data;
}

type DailyMember = {
  email: string;
  name: string;
};

export async function sendDailyLoveLetterToAll() {
  const supabase = createAdminSupabaseClient();
  const members: DailyMember[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Load auth users failed: ${error.message}`);
    }

    const users = data.users ?? [];
    for (const user of users) {
      const email = user.email?.trim().toLowerCase();
      if (!email) {
        continue;
      }

      const meta = user.user_metadata ?? {};
      const name =
        (typeof meta.name === "string" && meta.name.trim())
        || (typeof meta.userid === "string" && meta.userid.trim())
        || email.split("@")[0]
        || "friend";

      members.push({ email, name });
    }

    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  const result = {
    total: members.length,
    sent: 0,
    failed: 0,
  };

  for (const user of members) {
    try {
      await sendDailyLoveLetter(user.email, user.name);
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("[daily-love-letter] send failed", { email: user.email, name: user.name, message });
    }
  }

  return result;
}
