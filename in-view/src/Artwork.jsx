import { useEffect, useRef, useState } from 'react'

export function Artwork({ heroRef, works, paused, onReady }) {
  const canvasRef = useRef(null)
  const rearRef = useRef(null)
  const orbitRef = useRef(null)
  const [live, setLive] = useState(false)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
    orbitRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    let active = true
    const canvas = canvasRef.current
    const rear = rearRef.current
    const hero = heroRef.current

    import('./orbit.js').then(({ mountOrbit }) => {
      if (!active) return
      orbitRef.current = mountOrbit(canvas, rear, hero, works, (available) => {
        if (!active) return
        setLive(available)
        onReady(true)
      })
      orbitRef.current?.setPaused(pausedRef.current)
      if (!orbitRef.current) onReady(true)
    }).catch(() => { if (active) onReady(true) })

    return () => {
      active = false
      orbitRef.current?.dispose()
      orbitRef.current = null
    }
  }, [heroRef, works, onReady])

  return (
    <>
      <canvas ref={rearRef} className={'hero-art hero-art-rear ' + (live ? 'art-ready' : '')} aria-hidden="true" />
      <figure className={'hero-art ' + (live ? 'art-ready' : '')} role="img" aria-label="LANP 概念作品卡片穿过标题绕行">
        <div className="art-fallback" aria-hidden="true">
          {works.slice(0, 3).map((work) => (
            <div className="art-paper" key={work.title}>
              <small>LANP / 作品档案</small>
              <strong>{work.title}</strong>
              <img src={work.image} alt="" width="768" height="512" decoding="async" />
              <small>{work.type}</small>
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} className="art-live" aria-hidden="true" />
      </figure>
    </>
  )
}
