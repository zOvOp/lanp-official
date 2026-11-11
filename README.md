# LANP 文化传媒官网

LANP 文化传媒有限公司的中文品牌站。React 首页源码位于 `in-view/`。桌面首屏用 WebGL 绘制作品卡片，系统减少动效偏好和站内暂停按钮可停用动态效果。作品档案在浏览器中生成和导出。

## 本地预览

需要 Node.js 22 或更新版本。

```sh
npm ci --prefix in-view
npm run check
npm run dev
```

打开 http://127.0.0.1:4173 。

```sh
npm run build
npm run preview
```

`preview` 查看 `dist/`，也支持 GitHub Pages 子路径 http://127.0.0.1:4173/lanp-official/ 。

## 部署

`.github/workflows/pages.yml` 在推送到 `main` 后安装锁定的依赖、构建 `dist/` 并发布到 GitHub Pages。构建会保留隐私页、版权说明和 404 页等静态文件。

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
