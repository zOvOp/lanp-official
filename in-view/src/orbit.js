import {
  BackSide, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, PerspectiveCamera,
  Plane, PlaneGeometry, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'

const radius = 2.32
const turn = Math.PI * 2
const initialAngle = -0.18

function makePaper() {
  const geometry = new PlaneGeometry(1.65, 2.25, 24, 1)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const angle = positions.getX(i) / radius
    positions.setXYZ(i, Math.sin(angle) * radius, positions.getY(i), Math.cos(angle) * radius)
  }
  return geometry
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  ctx.drawImage(image, (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height)
}

function createTexture(work, index, onImageSettled) {
  const paper = document.createElement('canvas')
  paper.width = 448
  paper.height = 604
  const ctx = paper.getContext('2d')
  const texture = new CanvasTexture(paper)
  texture.colorSpace = SRGBColorSpace
  const image = new Image()
  const page = String(index + 1).padStart(2, '0')

  function paint(art) {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 448, 604)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 21px Arial, sans-serif'
    ctx.fillText('LANP / ART INDEX', 24, 41)
    ctx.textAlign = 'right'
    ctx.fillText(page, 424, 41)
    ctx.textAlign = 'left'
    ctx.font = '600 48px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.fillText(work.title, 24, 116, 400)
    ctx.font = '400 22px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.fillText(work.type, 24, 159)
    if (art) drawImageCover(ctx, art, 24, 190, 400, 304)
    else {
      ctx.fillStyle = '#f0d8c0'
      ctx.fillRect(24, 190, 400, 304)
    }
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 0.4
    ctx.fillRect(24, 522, 400, 1)
    ctx.globalAlpha = 1
    ctx.font = '400 22px monospace'
    ctx.fillText(work.date.replaceAll('-', '.'), 24, 565)
    ctx.textAlign = 'right'
    ctx.fillText('↗', 424, 565)
    ctx.textAlign = 'left'
    texture.needsUpdate = true
  }

  paint()
  image.onload = () => { paint(image); onImageSettled() }
  image.onerror = onImageSettled
  image.src = work.image
  return { texture, dispose: () => { image.onload = null; image.onerror = null; texture.dispose() } }
}

export function mountOrbit(canvas, rearCanvas, hero, works, onAvailability) {
  const renderers = []
  const canvases = [canvas, rearCanvas]
  try {
    for (const layer of canvases) {
      renderers.push(new WebGLRenderer({ canvas: layer, alpha: true, antialias: true, powerPreference: 'low-power' }))
    }
  } catch {
    renderers.forEach((renderer) => renderer.dispose())
    return null
  }
  // Both canvases see the same ring, split at the plane occupied by the heading.
  renderers[0].clippingPlanes = [new Plane(new Vector3(0, 0, 1), 0)]
  renderers[1].clippingPlanes = [new Plane(new Vector3(0, 0, -1), 0)]

  const scene = new Scene()
  const poster = hero.querySelector('.poster-wide')
  const camera = new PerspectiveCamera(35, 1, 0.1, 40)
  const pivot = new Group()
  const ring = new Group()
  const geometry = makePaper()
  const back = new MeshBasicMaterial({
    color: new Color('#f07830').multiplyScalar(0.57), side: BackSide, toneMapped: false,
  })
  pivot.add(ring)
  scene.add(pivot)

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const target = { x: 0, y: 0, scroll: 0 }
  const current = { x: 0, y: 0, scroll: 0 }
  let visible = true
  let paused = false
  const lostContexts = new Set()
  let hasDrawn = false
  let ready = false
  let remaining = works.length
  let frame = 0
  let lastTime = 0
  let phase = initialAngle
  let elapsed = 0
  let mobile = false
  let pointerInside = false
  let letteringX = 0

  function announce() {
    if (hasDrawn && !remaining && !ready) {
      ready = true
      onAvailability(true)
    }
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !lostContexts.size) frame = requestAnimationFrame(draw)
  }

  const sheets = works.map((work, index) => createTexture(work, index, () => {
    remaining--
    announce()
    schedule()
  }))
  const materials = sheets.map(({ texture }) => new MeshBasicMaterial({ map: texture, toneMapped: false }))
  for (let i = 0; i < 7; i++) {
    const position = new Group()
    position.rotation.y = i * turn / 7
    position.add(new Mesh(geometry, materials[i % materials.length]), new Mesh(geometry, back))
    ring.add(position)
  }

  function draw(time) {
    frame = 0
    const dt = lastTime ? Math.min(50, time - lastTime) : 16
    lastTime = time
    const resting = paused || motion.matches
    const entered = document.documentElement.hasAttribute('data-lanp-entered')
    if (!resting && entered) {
      elapsed += dt
      if (!pointerInside) phase -= dt * 0.00015
    }
    const approach = 1 - Math.exp(-dt / 115)
    for (const axis of ['x', 'y', 'scroll']) current[axis] += (target[axis] - current[axis]) * approach
    if (Math.abs(current.x - letteringX) > 0.0005) {
      letteringX = current.x
      poster.style.setProperty('--pointer-x', letteringX.toFixed(4))
    }
    const unfold = resting ? 1 : 1 - Math.pow(1 - Math.min(elapsed / 950, 1), 4)
    const scroll = current.scroll
    pivot.position.set((mobile ? -0.91 : 0.13) + current.x * 0.15, (mobile ? 0.32 : -0.11) - scroll * 0.38, 0)
    pivot.rotation.set(0.29 - current.y * 0.11 + scroll * 0.15, 0.14 + current.x * 0.07, mobile ? 0.64 : 0.44)
    pivot.scale.setScalar((0.68 + unfold * 0.32) * (1 - scroll * 0.11))
    ring.rotation.y = phase + current.x * 1.32 - scroll * 1.9 + (1 - unfold) * 0.86
    for (const renderer of renderers) renderer.render(scene, camera)
    hasDrawn = true
    announce()
    if (!resting) schedule()
    else lastTime = 0
  }

  function resize() {
    const { clientWidth, clientHeight } = canvas
    if (!clientWidth || !clientHeight) return
    mobile = clientWidth < 768
    camera.aspect = clientWidth / clientHeight
    camera.position.z = mobile ? 13.0 : Math.max(9.8, 11.8 / camera.aspect)
    camera.updateProjectionMatrix()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35)
    for (const renderer of renderers) {
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(clientWidth, clientHeight, false)
    }
    schedule()
  }

  function move(event) {
    if (paused || motion.matches || event.pointerType === 'touch') return
    const box = hero.getBoundingClientRect()
    pointerInside = true
    target.x = (event.clientX - box.left) / box.width * 2 - 1
    target.y = (event.clientY - box.top) / box.height * 2 - 1
  }

  function leave() {
    pointerInside = false
    target.x = 0
    target.y = 0
  }

  function scroll() {
    if (!paused && !motion.matches && visible) target.scroll = Math.min(window.scrollY / hero.clientHeight, 1)
  }

  function resetMotion() {
    pointerInside = false
    Object.assign(target, { x: 0, y: 0, scroll: 0 })
    Object.assign(current, target)
    if (motion.matches) phase = initialAngle
    schedule()
  }

  function contextLost(event) {
    event.preventDefault()
    lostContexts.add(event.currentTarget)
    suspend()
    onAvailability(false)
  }

  function restored(event) {
    lostContexts.delete(event.currentTarget)
    if (lostContexts.size) return
    onAvailability(ready)
    resize()
  }

  function suspend() {
    cancelAnimationFrame(frame)
    frame = 0
    lastTime = 0
  }

  function visibility() {
    if (document.hidden) suspend()
    else schedule()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) {
      scroll()
      schedule()
    } else suspend()
  }, { threshold: 0.02 })
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  intersection.observe(hero)
  hero.addEventListener('pointermove', move, { passive: true })
  hero.addEventListener('pointerleave', leave)
  window.addEventListener('scroll', scroll, { passive: true })
  document.addEventListener('visibilitychange', visibility)
  motion.addEventListener('change', resetMotion)
  for (const layer of canvases) {
    layer.addEventListener('webglcontextlost', contextLost)
    layer.addEventListener('webglcontextrestored', restored)
  }
  resize()

  return {
    setPaused(value) {
      paused = value
      if (paused) suspend()
      else {
        scroll()
        schedule()
      }
    },
    dispose() {
      suspend()
      observer.disconnect()
      intersection.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
      window.removeEventListener('scroll', scroll)
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', resetMotion)
      for (const layer of canvases) {
        layer.removeEventListener('webglcontextlost', contextLost)
        layer.removeEventListener('webglcontextrestored', restored)
      }
      poster.style.removeProperty('--pointer-x')
      materials.forEach((material) => material.dispose())
      sheets.forEach((sheet) => sheet.dispose())
      back.dispose()
      geometry.dispose()
      renderers.forEach((renderer) => renderer.dispose())
    },
  }
}
