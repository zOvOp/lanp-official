import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Artwork } from './Artwork.jsx'
import { Dialog, PortfolioForm } from './PortfolioForm.jsx'
import { useEditorialMotion } from './editorialMotion.js'
import fold from './art/fold.webp'
import clay from './art/clay.webp'
import book from './art/book.webp'
import fabric from './art/fabric.webp'

const navigation = [
  ['关于我们', '#about'], ['我们的产品', '#product'], ['社区论坛', '#community'],
  ['定价', '#pricing'], ['常见问题', '#faq'],
]

const works = [
  {
    title: '光有折痕', type: '纸上摄影', date: '2026-11-08', image: fold,
    alt: '侧光照在折叠白纸上，纸面之间形成深黑色的弧形阴影',
    note: '一束侧光沿着纸的折面移动。明暗的交界处，平面有了体积。',
  },
  {
    title: '缓慢的弧', type: '陶土装置', date: '2026-10-25', image: clay,
    alt: '一条浅陶色的弯曲带状雕塑，静置在展台上',
    note: '用泥土留住一次扭转。装置的边缘随着观看角度打开。',
  },
  {
    title: '纸页之间', type: '艺术家书', date: '2026-10-11', image: book,
    alt: '摊开的艺术家书，纸页上印有黑色抽象形状',
    note: '一页只放一个形状。翻页的间隙，让前后两幅图在记忆里叠合。',
  },
  {
    title: '房间里有风', type: '织物装置', date: '2026-09-27', image: fabric,
    alt: '浅桃色织物悬在白色展厅内，日光从一侧照入',
    note: '悬挂的织物把房间分成两个仍然相通的空间。光线让褶皱的轮廓缓缓改变。',
  },
]

const Arrow = ({ direction = 'diagonal' }) => (
  <span aria-hidden="true">{ { diagonal: '↗', right: '→', left: '←', down: '↓' }[direction] }</span>
)

function Action({ onClick, children, quiet = false, className = '' }) {
  return <button type="button" className={'action ' + (quiet ? 'action-quiet ' : 'action-primary ') + className} onClick={onClick}>{children}</button>
}

function Header({ create, paused, toggleMotion }) {
  const menu = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [pageActionVisible, setPageActionVisible] = useState(true)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY >= 40)
    update()
    window.addEventListener('scroll', update, { passive: true })
    const visible = new Set()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      })
      setPageActionVisible(visible.size > 0)
    }, { rootMargin: '-60px 0px 0px' })
    document.querySelectorAll('[data-page-action]').forEach((button) => observer.observe(button))
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeAtDesktop = ({ matches }) => { if (matches) menu.current?.close() }
    desktop.addEventListener('change', closeAtDesktop)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update)
      desktop.removeEventListener('change', closeAtDesktop)
    }
  }, [])

  return (
    <header className={'site-header ' + (scrolled ? 'header-scrolled' : '')}>
      <a className="skip-link" href="#main">跳至正文</a>
      <div className="nav-inner flex items-center justify-between">
        <a href="#main" className="wordmark" aria-label="LANP 首页">LANP<span aria-hidden="true">.</span></a>
        <nav className="hidden items-center md:flex" aria-label="主导航">
          {navigation.map(([label, href]) => <a className="line-link" href={href} key={href}>{label}</a>)}
        </nav>
        <div className="header-tools hidden items-center md:flex">
          <button type="button" className="header-motion" aria-label="暂停页面动效" aria-pressed={paused} title={paused ? '恢复动效' : '暂停动效'} onClick={toggleMotion}>
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>
          </button>
          <Action onClick={create} quiet={pageActionVisible} className="header-action">建立档案 <Arrow /></Action>
        </div>
        <button type="button" className="menu-button md:hidden" aria-haspopup="dialog" aria-controls="mobile-menu" onClick={() => menu.current.showModal()}>
          菜单 <span className="menu-bars" aria-hidden="true" />
        </button>
      </div>
      <dialog ref={menu} id="mobile-menu" className="mobile-menu" aria-label="主导航">
        <div className="menu-top flex items-center justify-between">
          <a href="#main" className="wordmark" onClick={() => menu.current.close()}>LANP.</a>
          <button type="button" className="menu-button" onClick={() => menu.current.close()} autoFocus>关闭 <span aria-hidden="true">×</span></button>
        </div>
        <nav aria-label="移动端主导航">
          {navigation.map(([label, href]) => (
            <a className="line-link" href={href} key={href} onClick={() => menu.current.close()}>{label}<Arrow /></a>
          ))}
        </nav>
        <Action onClick={() => { menu.current.close(); create() }}>建立档案 <Arrow /></Action>
      </dialog>
    </header>
  )
}

function Display({ as: Tag = 'h2', children, id, className = '' }) {
  return <Tag id={id} lang="en" className={'display motion-heading ' + className} data-motion-reveal><span>{children}</span></Tag>
}

function ArtImage({ work, className }) {
  return <img className={className} src={work.image} alt={work.alt} width="768" height="512" loading="lazy" decoding="async" />
}

const posterLetters = [
  ['I', 0.84, -0.17], ['N', 0.95, 0.04], [' ', 1, 0],
  ['V', 0.87, 0.12], ['I', 0.84, -0.13], ['E', 0.91, 0.09],
  ['W', 0.90, 0.14], ['.', 0.92, 0.07],
]

function PosterTitle() {
  const title = useRef(null)
  useLayoutEffect(() => {
    const lines = [...title.current.querySelectorAll('.poster-line')]
    function fit() {
      for (const line of lines) {
        const glyphs = line.querySelector('.poster-glyphs')
        if (!line.clientWidth || !glyphs.offsetWidth) continue
        line.style.setProperty('--fit-x', (line.clientWidth / glyphs.offsetWidth).toFixed(4))
        line.style.setProperty('--fit-y', ((line.clientHeight - 4) / glyphs.offsetHeight).toFixed(4))
      }
    }
    const observer = new ResizeObserver(fit)
    observer.observe(title.current)
    for (const line of lines) observer.observe(line.querySelector('.poster-glyphs'))
    fit()
    return () => observer.disconnect()
  }, [])

  return (
    <h1 ref={title} id="hero-title" className="poster-title" lang="en" aria-label="IN VIEW.">
      <span className="poster-line poster-wide" aria-hidden="true">
        <span className="poster-fit">
          <span className="poster-glyphs">
            {posterLetters.map(([letter, height, travel], index) => letter === ' ' ? ' ' : (
              <span className="poster-letter" key={index} style={{ '--letter-height': height, '--letter-travel': travel }}>{letter}</span>
            ))}
          </span>
        </span>
      </span>
      <span className="poster-line poster-narrow poster-in" aria-hidden="true"><span className="poster-fit"><span className="poster-glyphs">IN</span></span></span>
      <span className="poster-line poster-narrow poster-view" aria-hidden="true"><span className="poster-fit"><span className="poster-glyphs">VIEW.</span></span></span>
    </h1>
  )
}

function Hero({ create, paused, toggleMotion }) {
  const hero = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const fallback = window.setTimeout(() => setReady(true), 1500)
    return () => window.clearTimeout(fallback)
  }, [])

  useEffect(() => {
    if (!ready) return
    const enter = window.setTimeout(() => {
      document.documentElement.setAttribute('data-lanp-entered', '')
    }, Math.max(0, 760 - performance.now()))
    return () => window.clearTimeout(enter)
  }, [ready])

  return (
    <section ref={hero} className="hero" aria-labelledby="hero-title">
      <PosterTitle />
      <Artwork heroRef={hero} works={works} paused={paused} onReady={setReady} />
      <div className="hero-bottom">
        <div className="hero-message">
          <p>让作品走出工作室。</p>
          <a className="line-link" href="#selected">浏览精选 <Arrow direction="down" /></a>
        </div>
        <button type="button" className="motion-toggle" aria-label="暂停页面动效" aria-pressed={paused} onClick={toggleMotion}>
          <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span> {paused ? '恢复动效' : '暂停动效'}
        </button>
        <span data-page-action><Action onClick={create}>建立作品档案 <Arrow /></Action></span>
      </div>
    </section>
  )
}

function Opening({ create, paused, toggleMotion }) {
  const sequence = useRef(null)
  useEffect(() => {
    const wrapper = sequence.current
    let frame = 0
    function update() {
      frame = 0
      const progress = Math.min(1, Math.max(0, -wrapper.getBoundingClientRect().top / (window.innerHeight * 0.78)))
      wrapper.style.setProperty('--arrival-angle', ((1 - progress) * 7).toFixed(2) + 'deg')
      wrapper.style.setProperty('--arrival-inset', ((1 - progress) * 38).toFixed(2) + 'px')
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  return <div ref={sequence} className="opening-sequence"><Hero create={create} paused={paused} toggleMotion={toggleMotion} /><About /></div>
}

function About() {
  return (
    <section id="about" className="about surface section-space" aria-labelledby="about-title">
      <div className="frame">
        <h2 className="eyebrow" id="about-title">为创作者而做</h2>
        <p className="about-statement motion-heading" data-motion-reveal><span>给作品留出一整页。</span></p>
        <p className="body-copy">LANP 文化传媒于 2021 年成立于四川。我们为艺术家与策展人做了一个轻便的作品档案工具。</p>
        <ul className="disciplines" data-motion-reveal aria-label="适用创作领域">
          {['摄影', '影像', '装置', '表演', '出版'].map((label) => <li key={label}>{label}</li>)}
        </ul>
      </div>
    </section>
  )
}

function Selected({ openWork }) {
  return (
    <section id="selected" className="section-space" aria-labelledby="selected-title">
      <div className="frame">
        <p className="eyebrow section-label">精选 · 概念作品</p>
        <Display id="selected-title">SELECT</Display>
        <div className="selected-grid grid">
          {works.slice(0, 2).map((work) => (
            <button type="button" className="work-card group" key={work.title} onClick={() => openWork(work)}>
              <div className="work-image motion-wipe" data-motion-reveal data-parallax><ArtImage work={work} /></div>
              <span className="work-info flex items-center justify-between gap-4">
                <span><strong>{work.title}</strong><small>{work.type}</small></span>
                <Arrow />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Current({ openWork }) {
  const track = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const list = track.current
    const sync = () => {
      const start = list.scrollLeft <= 1
      const end = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1
      setEdges((previous) => previous.start === start && previous.end === end ? previous : { start, end })
    }
    const resize = new ResizeObserver(sync)
    resize.observe(list)
    list.addEventListener('scroll', sync, { passive: true })
    sync()
    return () => {
      list.removeEventListener('scroll', sync)
      resize.disconnect()
    }
  }, [])

  function step(direction) {
    const list = track.current
    const item = list.firstElementChild
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({ left: direction * (item.offsetWidth + gap), behavior: reduce ? 'instant' : 'smooth' })
  }

  return (
    <section id="community" className="section-space current surface" aria-labelledby="current-title">
      <div className="frame current-inner">
        <p className="eyebrow section-label">社区论坛 · 概念档案</p>
        <div className="current-top flex items-end justify-between">
          <Display id="current-title">NOW</Display>
          <div className="slider-controls flex gap-2">
            <button type="button" aria-label="上一件项目" disabled={edges.start} onClick={() => step(-1)}><Arrow direction="left" /></button>
            <button type="button" aria-label="下一件项目" disabled={edges.end} onClick={() => step(1)}><Arrow direction="right" /></button>
          </div>
        </div>
        <ul ref={track} className="project-track" data-motion-reveal aria-label="近期项目">
          {works.map((work) => (
            <li key={work.title}>
              <button type="button" onClick={() => openWork(work)}>
                <time dateTime={work.date}>{work.date.replaceAll('-', '.')}</time>
                <img className="project-image" src={work.image} alt="" width="768" height="512" loading="lazy" decoding="async" />
                <span className="project-name">{work.title}</span>
                <span className="project-type">{work.type} <Arrow /></span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const values = [
  { label: '你的作品页', title: 'EDIT', copy: '作品、自述与联络方式，排在一页。', work: works[2] },
  { label: '展览之后', title: 'SEND', copy: '导出你的档案，随邮件或讯息分享。', work: works[3] },
]

function Product() {
  return (
    <section id="product" className="section-space" aria-label="我们的产品">
      <div className="frame value-stack grid">
        {values.map((value) => (
          <article className="value-row grid" key={value.title}>
            <div className="value-copy" data-parallax>
              <p className="eyebrow section-label">{value.label}</p>
              <Display>{value.title}</Display>
              <p className="body-copy">{value.copy}</p>
            </div>
            <div className="value-art" data-parallax>
              <div className="value-mat motion-wipe" data-motion-reveal>
                <ArtImage work={value.work} className="value-image" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Closing({ create }) {
  return (
    <section id="pricing" className="closing section-space" aria-labelledby="closing-title">
      <div className="closing-prints" aria-hidden="true">
        {[works[0], works[1]].map((work) => (
          <div className="closing-print" key={work.title} data-parallax>
            <img src={work.image} alt="" width="768" height="512" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      <div className="frame">
        <p className="eyebrow section-label">把下一次相遇留住</p>
        <Display id="closing-title">OPEN.</Display>
        <div className="closing-action" data-page-action><Action onClick={create}>建立作品档案 <Arrow /></Action></div>
        <p className="reassurance">免费体验 · 无需信用卡</p>
      </div>
    </section>
  )
}

function Footer({ create }) {
  return (
    <footer className="site-footer surface">
      <div className="frame">
        <div className="footer-top grid">
          <a href="#main" className="wordmark" aria-label="LANP 返回顶部">LANP.</a>
          <nav className="footer-links" aria-label="探索">
            <p className="eyebrow">探索</p>
            <a className="line-link" href="#selected">精选作品</a>
            <a className="line-link" href="#community">社区论坛</a>
          </nav>
          <nav className="footer-links" aria-label="产品">
            <p className="eyebrow">档案</p>
            <button className="line-link" type="button" onClick={create}>建立档案</button>
            <a className="line-link" href="#pricing">定价</a>
          </nav>
          <div id="faq" className="footer-faq">
            <h2 className="eyebrow">常见问题</h2>
            <details><summary>档案保存在哪里？</summary><p>档案在浏览器中生成，可下载成独立网页。</p></details>
            <details><summary>可以放几件作品？</summary><p>每份档案可放三件作品，支持 JPG、PNG 与 WebP。</p></details>
          </div>
        </div>
        <div className="footer-legal flex flex-wrap justify-between gap-4">
          <p>© 2026 LANP 文化传媒</p>
          <p>概念作品 · 图像为原创生成</p>
        </div>
      </div>
    </footer>
  )
}

export function App() {
  const [panel, setPanel] = useState(null)
  const [paused, setPaused] = useState(false)
  const main = useRef(null)
  const toggleMotion = () => setPaused((value) => !value)
  const create = () => setPanel({ type: 'create' })
  const openWork = (work) => setPanel({ type: 'work', work })
  useEditorialMotion(main)
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    if (!target) return
    const frame = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <>
      <Header create={create} paused={paused} toggleMotion={toggleMotion} />
      <main ref={main} id="main" tabIndex={-1} data-motion-paused={paused ? '' : undefined}>
        <Opening create={create} paused={paused} toggleMotion={toggleMotion} />
        <Selected openWork={openWork} />
        <Current openWork={openWork} />
        <Product />
        <Closing create={create} />
      </main>
      <Footer create={create} />
      {panel && (
        <Dialog onClose={() => setPanel(null)} title={panel.type === 'create' ? '建立作品档案' : panel.work.title}>
          {panel.type === 'create' ? <PortfolioForm /> : (
            <figure className="work-detail">
              <ArtImage work={panel.work} />
              <figcaption>
                <p className="eyebrow">{panel.work.type} · 概念作品</p>
                <p>{panel.work.note}</p>
              </figcaption>
            </figure>
          )}
        </Dialog>
      )}
    </>
  )
}
