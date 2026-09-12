import { Image, Link, Text, View } from "@react-pdf/renderer";
import { linusContact } from "../../data/rentGuideData";
import { SITE_HOST, SITE_URL } from './fonts.js';
import { LINE_GREEN, styles, WECHAT_GREEN } from './styles.js';


/* ───────────── 聯絡頁（固定在最後一頁） ───────────── */
/** 每頁共用的頁首／頁尾。fixed 元素必須是 Page 直接子元素且放在內容之前，否則頁碼不出現。 */
export function PageChrome({ dateText }: { dateText: string }) {
  return (
    <>
      <View style={styles.headerBar} fixed />
      <Text style={styles.headerLeft} fixed>LINUS 住好日</Text>
      <Text style={styles.headerRight} fixed>物件圖紙分析報告・{dateText}</Text>
      <View style={styles.headerRule} fixed />
      <View style={styles.footerRule} fixed />
      <Text style={[styles.footerText, styles.footerLeft]} fixed>
        {SITE_HOST}　｜　本報告由 LINUS 住好日自動產生，僅供參考
      </Text>
      <Text style={[styles.footerText, styles.footerRight]} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );
}

export function ContactPage({ assetBase }: { assetBase: string }) {
  const src = (p: string) => `${assetBase}${p}`;
  return (
    <View wrap={false}>
      <View style={styles.contactHero}>
        <Image src={src("/logo.png")} style={styles.contactLogo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>有問題？直接找 Linus 聊聊</Text>
          <Text style={styles.contactLead}>
            看完這份分析，想確認物件細節、安排看房，或需要日本租屋・買房的全程協助，
            掃 QR code 或用下方任何一種方式聯絡都可以。中文溝通、日本現地服務。
          </Text>
        </View>
      </View>

      <View style={styles.qrRow}>
        <View style={styles.qrCard}>
          <Text style={[styles.qrBrand, { backgroundColor: LINE_GREEN }]}>LINE</Text>
          <Image src={src("/pdf/line-qr.png")} style={styles.qrImage} />
          <Text style={styles.qrId}>ID：{linusContact.lineId}</Text>
          <Text style={styles.qrHint}>LINE 掃描加好友，或搜尋 ID 後直接傳訊息</Text>
        </View>
        <View style={[styles.qrCard, styles.qrCardLast]}>
          <Text style={[styles.qrBrand, { backgroundColor: WECHAT_GREEN }]}>WeChat</Text>
          <Image src={src("/pdf/wechat-qr.png")} style={styles.qrImage} />
          <Text style={styles.qrId}>ID：{linusContact.wechatId}</Text>
          <Text style={styles.qrHint}>WeChat「掃一掃」加好友，或搜尋 ID</Text>
        </View>
      </View>

      <View style={styles.channelRow}>
        <View style={styles.channel}>
          <Text style={styles.channelName}>EMAIL</Text>
          <Link src={`mailto:${linusContact.email}`} style={styles.channelValue}>{linusContact.email}</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>THREADS</Text>
          <Link src={linusContact.threads} style={styles.channelValue}>@linus3524</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>INSTAGRAM</Text>
          <Link src="https://www.instagram.com/linus3524" style={styles.channelValue}>@linus3524</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>FACEBOOK</Text>
          <Link src={linusContact.facebook} style={styles.channelValue}>facebook.com/r352410</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>網站</Text>
          <Link src={SITE_URL} style={styles.channelValue}>{SITE_HOST}</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>電話</Text>
          <Text style={styles.channelValue}>{linusContact.phone}</Text>
        </View>
      </View>

      <View style={styles.companyBox}>
        <Text style={styles.companyText}>{linusContact.name}｜{linusContact.title}</Text>
        <Text style={styles.companyText}>{linusContact.companyName}・{linusContact.licenseNo}</Text>
        <Text style={styles.companyText}>{linusContact.address}　營業時間 {linusContact.workingHours}（{linusContact.closedDays}休）</Text>
      </View>
    </View>
  );
}
