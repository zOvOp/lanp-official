# LANP 文化传媒官网

LANP 文化传媒有限公司的中文品牌站。静态页面，无后端、无表单提交。首屏在桌面端按需绘制 WebGL 光环，手机、弱设备、系统减少动效或图形不可用时，回退到同一套矢量舞台。

## 本地预览

需要 Node.js 22 或更新版本。

```sh
npm run check
npm run dev
```

打开 http://127.0.0.1:4173 。同一服务也接受 GitHub Pages 子路径 http://127.0.0.1:4173/lanp-official/ 。

```sh
npm run build
npm run preview
```

`preview` 查看 `dist/`。

## 部署

`.github/workflows/pages.yml` 在推送到 `main` 后，用最小权限构建 `dist/` 并发布到 GitHub Pages。仓库若是私有项目，Pages 可能需要公开仓库或付费方案，工作流本身不会绕过这个限制。

预期项目地址：https://zovop.github.io/lanp-official/

仓库里没有 `CNAME`。如果以后加入自定义域名文件，构建会把它复制进 `dist/`，并把页面里的上述地址替换成该域名。

旧参考页曾把预览主机写成 `lanp-culture-media.ceruleancreek2.chatgpt.site`。那不是独立的域名配置文件，已被本次页面替换掉，不作为正式 canonical。

## 待补充

- 对外联系方式：加入与商务合作都标明待补充，没有虚构邮箱、微信或提交成功状态。
- 正式标志：页脚标明待补充。站点图标只是光环图形，不是公司标志。
- 备案信息：页脚标明待补充，没有编写备案号。
- 真实作品、成员与活动照片：当前画廊是抽象概念视觉。

## 内容事实

公司全称 LANP 文化传媒有限公司。2021 年成立，位于四川，是专注文化传媒的公会，做娱乐与文化内容。重视成员、品质与创新，团队有创造力与激情。页面不补充未经提供的规模、奖项或客户。
