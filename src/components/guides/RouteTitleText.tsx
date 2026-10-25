// 租屋九站與買房流程卡片的標題：結尾的括號補充說明（例：「遞交買付申請書（買房意向書）」）換到下一行、字小一級。
// 括號在中間的（例：「匯入尾款（殘代金）與交易規費」）拆開會斷句，維持原樣。
export function RouteTitleText({ text }: { text: string }) {
  const m = text.match(/^(.+?)\s*([（(][^（()）]*[）)])$/);
  if (!m) return <>{text}</>;
  return <>{m[1]}<span className="rent-route-title-note">{m[2]}</span></>;
}
