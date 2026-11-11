import { useEffect, useRef, useState } from 'react'

export function Dialog({ title, onClose, children }) {
  const element = useRef(null)
  useEffect(() => { element.current.showModal() }, [])
  return (
    <dialog
      ref={element}
      className="content-dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === element.current) element.current.close() }}
    >
      <div className="dialog-content">
        <header className="dialog-header flex items-center justify-between gap-4">
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="close-button" aria-label="关闭" onClick={() => element.current.close()} autoFocus>×</button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ src: reader.result, alt: file.name.replace(/\.[^.]+$/, '') })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function downloadPortfolio(portfolio) {
  const doc = document.implementation.createHTMLDocument(portfolio.name + '｜作品档案')
  doc.documentElement.lang = 'zh-CN'
  const viewport = doc.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  const charset = doc.createElement('meta')
  charset.setAttribute('charset', 'utf-8')
  const style = doc.createElement('style')
  style.textContent = 'body{max-width:720px;margin:64px auto;padding:0 24px;color:#222;font:17px/1.65 system-ui,sans-serif}h1{font-size:clamp(40px,9vw,96px);line-height:1.05;margin:16px 0;color:#000}p{white-space:pre-wrap;overflow-wrap:anywhere}img{display:block;max-width:100%;height:auto;margin:24px 0}a{display:inline-block;overflow-wrap:anywhere;color:inherit;text-underline-offset:4px}small{letter-spacing:.08em}'
  doc.head.prepend(charset)
  doc.head.append(viewport, style)

  const main = doc.createElement('main')
  const label = doc.createElement('small')
  const title = doc.createElement('h1')
  const intro = doc.createElement('p')
  label.textContent = portfolio.field
  title.textContent = portfolio.name
  intro.textContent = portfolio.intro
  main.append(label, title, intro)
  if (portfolio.link) {
    const link = doc.createElement('a')
    link.href = portfolio.link
    link.textContent = '作品与联络 ↗'
    main.append(link)
  }
  for (const artwork of portfolio.images) {
    const image = doc.createElement('img')
    image.src = artwork.src
    image.alt = artwork.alt
    main.append(image)
  }
  doc.body.append(main)

  const url = URL.createObjectURL(new Blob(['<!doctype html>\n', doc.documentElement.outerHTML], { type: 'text/html;charset=utf-8' }))
  const download = document.createElement('a')
  download.href = url
  download.download = 'lanp-portfolio.html'
  document.body.append(download)
  download.click()
  download.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function PortfolioForm() {
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const preview = useRef(null)

  useEffect(() => { if (portfolio) preview.current?.focus() }, [portfolio])

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = form.get('name').trim()
    const field = form.get('field').trim()
    const intro = form.get('intro').trim()
    const link = form.get('link').trim()
    const files = form.getAll('images').filter((file) => file.size)
    setError('')
    if (!name || !field || !intro) {
      setError('请填写创作者名称、领域和自述。')
      return
    }
    if (link && !/^https?:\/\//i.test(link)) {
      setError('请填写以 https:// 或 http:// 开头的链接。')
      return
    }
    if (files.length > 3 || files.some((file) => file.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('请选择最多三张 JPG、PNG 或 WebP 图像，每张不超过 4 MB。')
      return
    }
    setLoading(true)
    try {
      const images = await Promise.all(files.map(readImage))
      setPortfolio({ name, field, intro, link, images })
    } catch {
      setError('图像读取失败，请重新选择图像。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="portfolio-form" onSubmit={submit} hidden={Boolean(portfolio)}>
        <p>整理你的介绍和作品，下载为一个可以分享的网页。</p>
        <div className="form-grid grid gap-4 sm:grid-cols-2">
          <label>创作者名称<input required name="name" maxLength="48" autoComplete="name" /></label>
          <label>创作领域<input required name="field" maxLength="36" /></label>
        </div>
        <label>创作自述<textarea required name="intro" rows="3" maxLength="160" /></label>
        <label>作品或联络链接（可选）<input name="link" type="url" placeholder="https://" maxLength="512" /></label>
        <label>作品图片（可选，最多三张）<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="action action-primary" type="submit" disabled={loading}>{loading ? '正在生成…' : '预览档案'} <span aria-hidden="true">↗</span></button>
      </form>
      {portfolio && (
        <div className="portfolio-result">
          <div ref={preview} className="portfolio-preview" tabIndex={-1}>
            <p className="eyebrow">{portfolio.field}</p>
            <h3>{portfolio.name}</h3>
            <p>{portfolio.intro}</p>
            {portfolio.link && <a className="line-link" href={portfolio.link}>作品与联络 ↗</a>}
            {portfolio.images.map(({ src, alt }, index) => <img key={index} src={src} alt={alt} />)}
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="action action-primary" type="button" onClick={() => downloadPortfolio(portfolio)}>下载作品档案 <span aria-hidden="true">↓</span></button>
            <button className="action action-quiet" type="button" onClick={() => setPortfolio(null)}>返回编辑</button>
          </div>
        </div>
      )}
    </>
  )
}
