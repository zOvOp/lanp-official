# LANP 文化传媒官网

为 LANP 文化传媒有限公司设计的中文响应式官网，使用静态 HTML、CSS、JavaScript 与本地 GSAP。无需安装 npm 依赖。

## 本地预览

需要 Node.js 22 或更新版本。

```sh
npm run dev
```

打开 http://127.0.0.1:4173。

## 检查与部署文件

```sh
npm run check
npm run build
```

将 `dist/` 部署到静态网站托管平台。Sites 身份与静态目录在 `.openai/hosting.json`。

## 内容维护

- `index.html`：公司介绍、内容方向、公会理念和联系方式。
- `styles.css`：品牌配色、排版及移动端布局。
- `app.js`：品牌字标的 GSAP 入场动效。
- `assets/img/`：本地 WebP 图片。
- `credits.html`：图片来源与许可。
- `privacy.html`：当前版本隐私说明。

## 待补充内容

联系方式尚未提供，页面已明确标注，没有虚构邮箱、手机号、二维码或报名提交。请在获得对外邮箱、微信或入会链接后替换联系区域。摄影图片是经许可使用的主题素材，不代表 LANP 的实际成员、场所或案例。正式品牌 Logo、活动照片与真实作品可直接替换。

## 设计与依赖

设计基础使用 Taste Skill 的系统、响应式布局和 word-highlight 交互；品牌动效使用 GSAP 3.13.0。保留原始资产及许可标记。GSAP 许可：https://gsap.com/standard-license/ 。摄影许可：https://unsplash.com/license 。
