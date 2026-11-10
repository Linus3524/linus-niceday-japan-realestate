/**
 * 在日身分／簽證種類：費用試算與找房問卷共用的唯一清單。
 * 要增減簽證種類只改這裡，兩邊一起更新。
 *
 * value 是費用試算審查規則使用的代號，不要隨意改名；
 * shortLabel 是問卷手機按鈕用的短名稱。
 */
export const VISA_TYPES = [
  { value: "日本籍", label: "日本籍（本國人）", shortLabel: "日本籍" },
  { value: "永住者", label: "永住者 / 定住者", shortLabel: "永住者／定住者" },
  { value: "技術・人文知識・國際業務", label: "工作簽證（就勞 / 技人國 / 正社員）", shortLabel: "工作簽證" },
  { value: "高度人才", label: "高度人才簽證（高薪 / 專業評分）", shortLabel: "高度人才" },
  { value: "留學", label: "留學簽證（大學 / 大學院 / 專門學校）", shortLabel: "留學（大學・專門學校）" },
  { value: "留學（日本語學校）", label: "留學簽證（日本語學校）", shortLabel: "留學（語言學校）" },
  { value: "打工度假", label: "打工度假簽證（Working Holiday）", shortLabel: "打工度假" },
  { value: "家族滯在", label: "家族滯在 / 配偶簽證", shortLabel: "家族滯在／配偶" },
  { value: "經營管理", label: "經營管理簽證 / 日本法人代表", shortLabel: "經營管理" },
] as const;

/** 不需要辦簽證的身分（問卷不再問簽證辦理進度）。 */
export const VISA_TYPES_WITHOUT_PROCESS: readonly string[] = ["日本籍", "永住者"];
