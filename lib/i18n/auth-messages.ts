import type { Locale } from "@/lib/i18n/config";

export type AuthMessages = {
  turnstileLoading: string;
  notConnectedTitle: string;
  notConnectedDesc: string;
  userFallback: string;
  noticeTitle: string;
  loadingSession: string;
  signedInPrefix: string;
  signOut: string;
  register: string;
  login: string;
  forgotPassword: string;
  closeAria: string;
  modalTitleRegister: string;
  modalTitleLogin: string;
  modalTitleForgot: string;
  modalDescRegister: string;
  modalDescLogin: string;
  modalDescForgot: string;
  useGithubLogin: string;
  useGoogleLogin: string;
  orUseEmailRegister: string;
  orUseEmailLogin: string;
  errorTitle: string;
  labelAccountLogin: string;
  labelUsername: string;
  labelEmail: string;
  labelPassword: string;
  labelCaptcha: string;
  placeholderAccountLogin: string;
  placeholderUsername: string;
  placeholderEmail: string;
  passwordPlaceholder: string;
  turnstileBypassMsg: string;
  turnstileSkipMsg: string;
  turnstileLocalBypassInfo: string;
  turnstileFailPrefix: string;
  turnstileFailSuffix: string;
  cancel: string;
  submitRegister: string;
  submitLogin: string;
  submitForgot: string;
  supabaseEnv: string;
  usernameShort: string;
  emailRequired: string;
  emailInvalid: string;
  passwordShort: string;
  captchaRequired: string;
  captchaVerifyFail: string;
  registerPendingEmailVerify: string;
  forgotSendFail: string;
  forgotBypassInfo: string;
  forgotSentInfo: string;
  registerSuccessLoggedIn: string;
  opFailed: string;
  forgotNetworkFail: string;
  oauthNoUrl: (provider: string) => string;
  oauthFail: (provider: string) => string;
};

const en: AuthMessages = {
  turnstileLoading: "Loading verification…",
  notConnectedTitle: "Supabase not configured",
  notConnectedDesc:
    "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then refresh.",
  userFallback: "User",
  noticeTitle: "Notice",
  loadingSession: "Loading session…",
  signedInPrefix: "Signed in:",
  signOut: "Sign out",
  register: "Register",
  login: "Log in",
  forgotPassword: "Forgot password?",
  closeAria: "Close",
  modalTitleRegister: "Create account",
  modalTitleLogin: "Log in",
  modalTitleForgot: "Reset password",
  modalDescRegister:
    "Choose a username, email, and password. We’ll email a reset link to this address if you forget your password.",
  modalDescLogin: "Enter your email or username and password.",
  modalDescForgot: "Enter your email and we’ll send a password reset link.",
  useGithubLogin: "Continue with GitHub",
  useGoogleLogin: "Continue with Google",
  orUseEmailRegister: "or register with email",
  orUseEmailLogin: "or log in with email",
  errorTitle: "Error",
  labelAccountLogin: "Account (email or username)",
  labelUsername: "Username",
  labelEmail: "Email",
  labelPassword: "Password",
  labelCaptcha: "Human verification",
  placeholderAccountLogin: "e.g. name@example.com or janesmith",
  placeholderUsername: "e.g. janesmith",
  placeholderEmail: "e.g. name@example.com",
  passwordPlaceholder: "At least 6 characters",
  turnstileBypassMsg:
    "Local dev: Turnstile UI skipped (using dev bypass token).",
  turnstileSkipMsg: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set; skipping captcha.",
  turnstileLocalBypassInfo:
    "Local dev: Turnstile returned 110200; using local bypass token.",
  turnstileFailPrefix: "Verification failed, please try again.",
  turnstileFailSuffix:
    " Make sure Turnstile allows this domain (127.0.0.1 / localhost).",
  cancel: "Cancel",
  submitRegister: "Register",
  submitLogin: "Log in",
  submitForgot: "Send reset link",
  supabaseEnv:
    "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  usernameShort: "Username / account must be at least 2 characters.",
  emailRequired: "Please enter an email address.",
  emailInvalid: "Please enter a valid email address.",
  passwordShort:
    "Password must be at least 6 characters (matches your Supabase policy; adjust in the dashboard).",
  captchaRequired: "Please complete human verification first.",
  captchaVerifyFail: "Verification did not pass, please try again.",
  registerPendingEmailVerify:
    "Registration submitted. If email confirmation is enabled in Supabase, check your inbox to verify; otherwise you can log in now.",
  forgotSendFail: "Failed to send reset email.",
  forgotBypassInfo:
    "Local dev: skipped sending a real email (network unreachable); flow check passed.",
  forgotSentInfo: "We sent a reset link to that inbox. Open the email to finish resetting your password.",
  registerSuccessLoggedIn: "Registered and signed in.",
  opFailed: "Something went wrong",
  forgotNetworkFail:
    "Could not reach Supabase to send the reset email (DNS / proxy / VPN). Check your network and try again.",
  oauthNoUrl: (provider) =>
    `No ${provider} authorization URL returned. Enable ${provider} in the Supabase dashboard.`,
  oauthFail: (provider) => `${provider} sign-in failed`,
};

const zh: AuthMessages = {
  turnstileLoading: "验证组件加载中…",
  notConnectedTitle: "未连接 Supabase",
  notConnectedDesc:
    "请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY 后刷新页面。",
  userFallback: "用户",
  noticeTitle: "提示",
  loadingSession: "加载登录状态…",
  signedInPrefix: "已登录：",
  signOut: "退出",
  register: "注册",
  login: "登录",
  forgotPassword: "忘记密码？",
  closeAria: "关闭",
  modalTitleRegister: "注册账号",
  modalTitleLogin: "登录",
  modalTitleForgot: "找回密码",
  modalDescRegister: "设置用户名、邮箱与密码。忘记密码时将向该邮箱发送重置链接。",
  modalDescLogin: "输入邮箱或用户名，以及密码。",
  modalDescForgot: "输入你的邮箱，我们会向该邮箱发送密码重置链接。",
  useGithubLogin: "使用 GitHub 登录",
  useGoogleLogin: "使用 Google 登录",
  orUseEmailRegister: "或使用邮箱注册",
  orUseEmailLogin: "或使用邮箱登录",
  errorTitle: "错误",
  labelAccountLogin: "账号（邮箱或用户名）",
  labelUsername: "用户名",
  labelEmail: "邮箱",
  labelPassword: "密码",
  labelCaptcha: "人机验证",
  placeholderAccountLogin: "例如：name@example.com 或 zhangsan",
  placeholderUsername: "例如：zhangsan",
  placeholderEmail: "例如：name@example.com",
  passwordPlaceholder: "至少 6 位",
  turnstileBypassMsg: "本地开发模式：已跳过 Turnstile 组件加载（使用开发兜底验证）。",
  turnstileSkipMsg: "未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY，当前跳过人机验证。",
  turnstileLocalBypassInfo: "本地开发模式：Turnstile 前端异常(110200)，已启用本地兜底验证。",
  turnstileFailPrefix: "人机验证失败，请重试。",
  turnstileFailSuffix: " 请确认 Turnstile 已允许当前域名（127.0.0.1 / localhost）。",
  cancel: "取消",
  submitRegister: "注册",
  submitLogin: "登录",
  submitForgot: "发送重置链接",
  supabaseEnv: "Supabase 未配置：请在 .env.local 中填写 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
  usernameShort: "用户名/账号至少 2 个字符。",
  emailRequired: "请输入邮箱地址。",
  emailInvalid: "请输入有效的邮箱地址。",
  passwordShort: "密码至少 6 位（与 Supabase 项目策略一致，可在控制台调整）。",
  captchaRequired: "请先完成人机验证。",
  captchaVerifyFail: "人机验证未通过，请重试。",
  registerPendingEmailVerify:
    "注册已提交。若你在 Supabase 开启了「邮箱确认」，请前往邮箱完成验证后再登录；若已关闭确认，请直接点击登录。",
  forgotSendFail: "发送重置邮件失败。",
  forgotBypassInfo: "本地开发模式：已跳过实际邮件发送（网络不可达），流程验证通过。",
  forgotSentInfo: "已发送重置密码链接到该邮箱，请前往邮箱完成密码重置。",
  registerSuccessLoggedIn: "注册成功，已登录。",
  opFailed: "操作失败",
  forgotNetworkFail:
    "发送重置邮件失败：当前网络无法连接 Supabase（DNS/代理/VPN 问题）。请检查网络后重试。",
  oauthNoUrl: (provider) =>
    `未获得 ${provider} 授权地址，请确认 Supabase 控制台已启用 ${provider} 提供商。`,
  oauthFail: (provider) => `${provider} 登录失败`,
};

export function getAuthMessages(locale: Locale): AuthMessages {
  return locale === "zh" ? zh : en;
}
