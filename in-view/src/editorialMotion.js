import { useEffect } from 'react'

const clamp = (value, low, high) => Math.max(low, Math.min(high, value))

export function useEditorialMotion(mainRef) {
  useEffect(() => {
    const main = mainRef.current
    const desktop = window.matchMedia('(min-width: 768px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disconnect

    function syncPreference() {
      disconnect?.()
      disconnect = desktop.matches && !reduced.matches ? connect(main) : undefined
    }

    syncPreference()
    desktop.addEventListener('change', syncPreference)
    reduced.addEventListener('change', syncPreference)
    return () => {
      disconnect?.()
      desktop.removeEventListener('change', syncPreference)
      reduced.removeEventListener('change', syncPreference)
    }
  }, [mainRef])
}

function connect(main) {
  const reveals = [...main.querySelectorAll('[data-motion-reveal]')]
  const layers = [...main.querySelectorAll('[data-parallax]')]
  const railSection = main.querySelector('#community')
  const railInner = railSection.querySelector('.current-inner')
  const rail = railSection.querySelector('.project-track')
  const controls = railSection.querySelector('.slider-controls')
  let frame = 0
  let travel = 0
  let manual = false

  const reveal = (element) => {
    element.dataset.appeared = ''
    arrivals.unobserve(element)
  }
  const arrivals = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) reveal(entry.target)
    }
  }, { rootMargin: '0px 0px -8% 0px' })

  for (const element of reveals) {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) reveal(element)
    else if (!element.hasAttribute('data-appeared')) arrivals.observe(element)
  }

  function draw() {
    frame = 0
    if (main.hasAttribute('data-motion-paused')) return
    const height = window.innerHeight
    const depths = layers.map((layer) => {
      const rect = layer.getBoundingClientRect()
      return clamp((height * 0.55 - (rect.top + rect.height / 2)) / (height * 0.66), -1, 1)
    })
    const scrollDistance = rail.scrollWidth - rail.clientWidth
    const stickyTop = parseFloat(getComputedStyle(railInner).top)
    const sectionTop = railSection.getBoundingClientRect().top
    const topPadding = parseFloat(getComputedStyle(railSection).paddingTop)
    const distance = stickyTop - (sectionTop + topPadding)

    layers.forEach((layer, index) => layer.style.setProperty('--depth', depths[index].toFixed(4)))
    if (distance < -height || distance > travel + height) manual = false
    if (!manual && travel > 0) {
      rail.dataset.scrollDriven = ''
      const next = Math.round(scrollDistance * clamp(distance / travel, 0, 1))
      if (rail.scrollLeft !== next) rail.scrollLeft = next
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  function resizeRail() {
    const width = rail.scrollWidth - rail.clientWidth
    travel = width > 1 ? clamp(width * 2.15, 360, 600) : 0
    railSection.style.setProperty('--rail-travel', travel + 'px')
    schedule()
  }

  function takeRailControl() {
    manual = true
    delete rail.dataset.scrollDriven
  }

  function onWheel(event) {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) takeRailControl()
  }

  function onFocus(event) {
    const element = event.target.closest('[data-motion-reveal]')
    if (element) reveal(element)
  }

  main.dataset.editorialMotion = ''
  resizeRail()
  const size = new ResizeObserver(resizeRail)
  size.observe(rail)
  const pause = new MutationObserver(schedule)
  pause.observe(main, { attributes: true, attributeFilter: ['data-motion-paused'] })
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', resizeRail, { passive: true })
  main.addEventListener('focusin', onFocus)
  for (const target of [rail, controls]) {
    target.addEventListener('pointerdown', takeRailControl, { passive: true })
    target.addEventListener('focusin', takeRailControl)
  }
  rail.addEventListener('wheel', onWheel, { passive: true })

  return () => {
    cancelAnimationFrame(frame)
    arrivals.disconnect()
    size.disconnect()
    pause.disconnect()
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', resizeRail)
    main.removeEventListener('focusin', onFocus)
    for (const target of [rail, controls]) {
      target.removeEventListener('pointerdown', takeRailControl)
      target.removeEventListener('focusin', takeRailControl)
    }
    rail.removeEventListener('wheel', onWheel)
    delete rail.dataset.scrollDriven
    delete main.dataset.editorialMotion
    railSection.style.removeProperty('--rail-travel')
    layers.forEach((layer) => layer.style.removeProperty('--depth'))
  }
}
