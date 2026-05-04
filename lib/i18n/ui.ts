import type { Locale } from "@/lib/i18n/config";

export type UiDictionary = {
  nav: { overview: string; tryOn: string; history: string };
  sidebar: {
    tagline: string;
    previewNoticeTitle: string;
    previewNoticeBody: string;
    contactPrompt: string;
    footerNote: string;
  };
  localeSwitcher: { label: string; en: string; zh: string };
  home: {
    sectionOverview: string;
    badge: string;
    headlineBefore: string;
    headlineYou: string;
    headlineAfter: string;
    lead: string;
    ctaTry: string;
    ctaHistory: string;
    cardTitle: string;
    cardDesc: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    loadAiDemo: string;
  };
  tryOn: {
    sectionLabel: string;
    title: string;
    lead: string;
    freeTries: string;
    refOnlyTitle: string;
    refOnlyDesc: string;
    errorTitle: string;
    uploadCardTitle: string;
    uploadCardDesc: string;
    yourPhoto: string;
    yourPhotoDesc: string;
    personLabel: string;
    personDesc: string;
    clothingTitle: string;
    clothingDesc: string;
    garmentLabel: string;
    garmentDesc: string;
    detectedCategory: string;
    waitingCategory: string;
    visionModel: string;
    localFallback: string;
    generating: string;
    generatePreview: string;
    clearResult: string;
    resetSession: string;
    detecting: string;
    previewTitle: string;
    previewDesc: string;
    placeholderTitle: string;
    placeholderDesc: string;
    downloadPng: string;
    emptyPreview: string;
    emptyPreviewLink: string;
    previewAlt: string;
    dropReplace: string;
    dropUpload: string;
    dropFormats: string;
    needBothForGenerate: string;
  };
  history: {
    sectionLabel: string;
    title: string;
    lead: string;
    emptyTitle: string;
    emptyDesc: string;
    startTryOn: string;
    previewAlt: string;
    download: string;
    delete: string;
  };
  category: { upper: string; lower: string; dress: string };
  resetPassword: {
    title: string;
    description: string;
    newPassword: string;
    confirmPassword: string;
    placeholder: string;
    confirmPlaceholder: string;
    submit: string;
    backHome: string;
    errorInvalidLink: string;
    errorShort: string;
    errorMismatch: string;
    success: string;
    errorTitle: string;
    successTitle: string;
  };
  authError: {
    title: string;
    body: string;
    backHome: string;
  };
};

const en: UiDictionary = {
  nav: { overview: "Overview", tryOn: "Try on", history: "History" },
  sidebar: {
    tagline: "Virtual try-on workspace",
    previewNoticeTitle: "Preview notice",
    previewNoticeBody:
      "Generated images are for shopping reference only and not sizing advice.",
    contactPrompt: "Have issues or suggestions?",
    footerNote: "Motion-friendly UI",
  },
  localeSwitcher: { label: "Language", en: "English", zh: "中文" },
  home: {
    sectionOverview: "Overview",
    badge: "Purchase-reference previews · Not sizing advice",
    headlineBefore: "See clothes on",
    headlineYou: "you",
    headlineAfter: ", before you buy.",
    lead: "ChangeClothing is a low-friction virtual try-on web tool for overseas shoppers. Upload your photo and a clothing image—we detect the garment type and render a still preview designed for shopping context, not tailoring precision.",
    ctaTry: "Start free try-on",
    ctaHistory: "View history",
    cardTitle: "Built for repeat use",
    cardDesc:
      "Keep your photo for the session, swap outfits, and stack previews while you browse stores.",
    feature1Title: "Your photo + one garment",
    feature1Desc: "Top, bottom, or dress—one piece per preview in V1.",
    feature2Title: "Auto category",
    feature2Desc: "We label upper, lower, or dress before generation.",
    loadAiDemo: "Load AI image demo (on demand — keeps first paint light)",
  },
  tryOn: {
    sectionLabel: "Try on",
    title: "Try on any outfit",
    lead: "Upload your photo and a clothing item to see how it looks on you.",
    freeTries: "2 free tries remaining",
    refOnlyTitle: "Reference only",
    refOnlyDesc:
      "Results are try-on preview images for shopping context. They are not sizing advice or a promise of how the garment will look in person.",
    errorTitle: "Something went wrong",
    uploadCardTitle: "Upload inputs",
    uploadCardDesc: "Left: your photo. Right: clothing photo.",
    yourPhoto: "Your photo",
    yourPhotoDesc: "Upload a full-body photo.",
    personLabel: "Person photo",
    personDesc: "Best results with a standing pose and clear lighting.",
    clothingTitle: "Clothing item",
    clothingDesc: "Upload the garment to try on.",
    garmentLabel: "Garment photo",
    garmentDesc: "Supports tops, bottoms, and dresses.",
    detectedCategory: "Detected category",
    waitingCategory: "Waiting for clothing image",
    visionModel: "vision model",
    localFallback: "local fallback",
    generating: "Generating preview…",
    generatePreview: "Generate preview",
    clearResult: "Clear result",
    resetSession: "Reset session",
    detecting: "Detecting garment category…",
    previewTitle: "Preview",
    previewDesc:
      "Configure ARK_API_KEY for full generation (Volcengine Ark / Seedream). Without it, the API echoes your photo as a placeholder while you wire the UI.",
    placeholderTitle: "Placeholder mode",
    placeholderDesc:
      "Connect a try-on backend (see .env.example) for a real composite. This preview shows your original photo only.",
    downloadPng: "Download PNG",
    emptyPreview:
      "Your preview lands here—usually within 10–20 seconds when a backend is connected.",
    emptyPreviewLink: "View saved previews in History",
    previewAlt: "Try-on preview",
    dropReplace: "Replace",
    dropUpload: "Upload",
    dropFormats: "JPEG, PNG, or WebP",
    needBothForGenerate:
      "Add your photo and a clothing image, then wait for automatic category detection.",
  },
  history: {
    sectionLabel: "History",
    title: "Saved previews",
    lead: "Stored locally in this browser for now. Sign-in sync is planned for a later release.",
    emptyTitle: "No previews yet",
    emptyDesc: "Generate a try-on preview first, then it will show up here.",
    startTryOn: "Start try-on",
    previewAlt: "Saved try-on preview",
    download: "Download",
    delete: "Delete",
  },
  category: { upper: "Upper body", lower: "Lower body", dress: "Dress" },
  resetPassword: {
    title: "Reset password",
    description:
      "Enter a new password. If the link expired, go back home and request “Forgot password” again.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    placeholder: "At least 6 characters",
    confirmPlaceholder: "Re-enter new password",
    submit: "Update password",
    backHome: "Back to home",
    errorInvalidLink: "Reset link is invalid or expired. Request a new one from “Forgot password”.",
    errorShort: "Password must be at least 6 characters.",
    errorMismatch: "Passwords do not match.",
    success: "Password updated. Return home to sign in again.",
    errorTitle: "Error",
    successTitle: "Success",
  },
  authError: {
    title: "Sign-in incomplete",
    body: "OAuth was cancelled, the link expired, or configuration is wrong. Close this page and try GitHub / Google sign-in again from the site.",
    backHome: "Back to home",
  },
};

const zh: UiDictionary = {
  nav: { overview: "概览", tryOn: "试衣", history: "历史" },
  sidebar: {
    tagline: "虚拟试衣工作台",
    previewNoticeTitle: "预览说明",
    previewNoticeBody: "生成图仅作购物参考，不构成尺码或合身建议。",
    contactPrompt: "有问题或建议？",
    footerNote: "动效友好界面",
  },
  localeSwitcher: { label: "语言", en: "English", zh: "中文" },
  home: {
    sectionOverview: "概览",
    badge: "购物参考预览 · 非尺码建议",
    headlineBefore: "买衣服前先看看",
    headlineYou: "穿在你身上的样子",
    headlineAfter: "。",
    lead: "ChangeClothing 面向海外网购的低门槛虚拟试衣：上传你的人像照与服装图，我们会识别服装类型并生成购物场景下的静态预览，用于参考而非量体裁衣精度。",
    ctaTry: "免费开始试衣",
    ctaHistory: "查看历史",
    cardTitle: "适合反复使用",
    cardDesc: "本会话内保留照片，可换装、叠加多张预览，边逛店边对比。",
    feature1Title: "人像 + 单件服装",
    feature1Desc: "上装、下装或连衣裙——V1 每次预览一件。",
    feature2Title: "自动识别类别",
    feature2Desc: "生成前会标注上装、下装或连衣裙。",
    loadAiDemo: "加载 AI 图像演示（按需加载，减轻首屏）",
  },
  tryOn: {
    sectionLabel: "试衣",
    title: "随心试穿单品",
    lead: "上传照片与服装图，看看上身效果。",
    freeTries: "剩余 2 次免费试用",
    refOnlyTitle: "仅供参考",
    refOnlyDesc:
      "结果为购物场景下的试衣预览图，不构成尺码建议，也不保证与线下实物完全一致。",
    errorTitle: "出错了",
    uploadCardTitle: "上传素材",
    uploadCardDesc: "左侧人像照，右侧服装平铺/挂拍图。",
    yourPhoto: "你的人像照",
    yourPhotoDesc: "请上传全身站姿、光线清晰的照片。",
    personLabel: "人像照片",
    personDesc: "站姿、光线清晰时效果更好。",
    clothingTitle: "服装单品",
    clothingDesc: "上传要试穿的服装图片。",
    garmentLabel: "服装照片",
    garmentDesc: "支持上装、下装、连衣裙。",
    detectedCategory: "识别到的类别",
    waitingCategory: "等待上传服装图",
    visionModel: "视觉模型",
    localFallback: "本地回退",
    generating: "正在生成预览…",
    generatePreview: "生成预览",
    clearResult: "清除结果",
    resetSession: "重置会话",
    detecting: "正在识别服装类别…",
    previewTitle: "预览",
    previewDesc:
      "配置 ARK_API_KEY 可调用完整生成（火山方舟 / Seedream）。未配置时接口会回传占位图，便于先接通界面。",
    placeholderTitle: "占位模式",
    placeholderDesc:
      "请接入试衣后端（见 .env.example）以输出真实合成图；当前仅显示原始人像。",
    downloadPng: "下载 PNG",
    emptyPreview: "预览将出现在此处；后端就绪时通常约 10–20 秒出图。",
    emptyPreviewLink: "在历史记录中查看已保存预览",
    previewAlt: "试衣预览图",
    dropReplace: "更换",
    dropUpload: "上传",
    dropFormats: "JPEG、PNG 或 WebP",
    needBothForGenerate: "请先上传人像与服装图，并等待自动识别服装类别。",
  },
  history: {
    sectionLabel: "历史",
    title: "已保存预览",
    lead: "当前仅保存在本浏览器；后续计划支持登录后云端同步。",
    emptyTitle: "暂无预览",
    emptyDesc: "先去试衣页生成一张预览，这里就会显示。",
    startTryOn: "开始试衣",
    previewAlt: "已保存的试衣预览",
    download: "下载",
    delete: "删除",
  },
  category: { upper: "上装", lower: "下装", dress: "连衣裙" },
  resetPassword: {
    title: "重置密码",
    description: "请输入新密码。若提示链接失效，请返回首页重新点击「忘记密码」发送新邮件。",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    placeholder: "至少 6 位",
    confirmPlaceholder: "再次输入新密码",
    submit: "更新密码",
    backHome: "返回首页",
    errorInvalidLink: "重置链接无效或已过期，请重新发起「忘记密码」。",
    errorShort: "新密码至少 6 位。",
    errorMismatch: "两次输入的密码不一致。",
    success: "密码已重置成功，请返回首页重新登录。",
    errorTitle: "错误",
    successTitle: "成功",
  },
  authError: {
    title: "登录未完成",
    body: "授权被取消、链接已过期或配置有误。请关闭本页后从网站再次使用 GitHub / Google 登录重试。",
    backHome: "返回首页",
  },
};

export function getUi(locale: Locale): UiDictionary {
  return locale === "zh" ? zh : en;
}
