import { useEffect, useRef } from 'react'

/**
 * Full-page confetti — falling paper plus streamer ribbons — ported from the
 * classic confetti-js script into a typed, client-safe component. Decorative
 * and non-interactive; fires once on mount and fades out after `durationMs`.
 *
 * The original ran forever, leaked its rAF + resize listener, and assumed a
 * browser at module load. This wrapper scopes all DOM access to the effect,
 * tears everything down on unmount, honors prefers-reduced-motion, and stops.
 */

const DEG_TO_RAD = Math.PI / 180

const SPEED = 50
const DT = 1 / SPEED
const RIBBON_COUNT = 11
const RIBBON_PARTICLE_COUNT = 30
const RIBBON_PARTICLE_DIST = 8
const RIBBON_THICKNESS = 8
const PAPER_COUNT = 95
const FADE_MS = 1200
/** A lighter pour on small screens — fewer pieces to draw, less busy. */
const MOBILE_RIBBON_COUNT = 7
const MOBILE_PAPER_COUNT = 60
const MOBILE_QUERY = '(max-width: 768px)'

type ColorPair = readonly [front: string, back: string]

const DEFAULT_COLORS: readonly ColorPair[] = [
  ['#df0049', '#660671'],
  ['#00e857', '#005291'],
  ['#2bebbc', '#05798a'],
  ['#ffd200', '#b06c00'],
]

class Vector2 {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  length() {
    return Math.sqrt(this.sqrLength())
  }

  sqrLength() {
    return this.x * this.x + this.y * this.y
  }

  add(v: Vector2) {
    this.x += v.x
    this.y += v.y
  }

  sub(v: Vector2) {
    this.x -= v.x
    this.y -= v.y
  }

  div(f: number) {
    this.x /= f
    this.y /= f
  }

  mul(f: number) {
    this.x *= f
    this.y *= f
  }

  normalize() {
    const sqrLen = this.sqrLength()
    if (sqrLen !== 0) {
      const factor = 1 / Math.sqrt(sqrLen)
      this.x *= factor
      this.y *= factor
    }
  }

  static sub(a: Vector2, b: Vector2) {
    return new Vector2(a.x - b.x, a.y - b.y)
  }
}

class EulerMass {
  position: Vector2
  mass: number
  drag: number
  force = new Vector2(0, 0)
  velocity = new Vector2(0, 0)
  constructor(x: number, y: number, mass: number, drag: number) {
    this.position = new Vector2(x, y)
    this.mass = mass
    this.drag = drag
  }

  addForce(f: Vector2) {
    this.force.add(f)
  }

  currentForce() {
    const totalForce = new Vector2(this.force.x, this.force.y)
    const speed = this.velocity.length()
    const dragVel = new Vector2(this.velocity.x, this.velocity.y)
    dragVel.mul(this.drag * this.mass * speed)
    totalForce.sub(dragVel)
    return totalForce
  }

  integrate(dt: number) {
    const acc = this.currentForce()
    acc.div(this.mass)
    const posDelta = new Vector2(this.velocity.x, this.velocity.y)
    posDelta.mul(dt)
    this.position.add(posDelta)
    acc.mul(dt)
    this.velocity.add(acc)
    this.force = new Vector2(0, 0)
  }
}

class ConfettiPaper {
  static bounds = new Vector2(0, 0)

  pos: Vector2
  rotationSpeed = Math.random() * 600 + 800
  angle = DEG_TO_RAD * Math.random() * 360
  rotation = DEG_TO_RAD * Math.random() * 360
  cosA = 1
  size = 5
  oscillationSpeed = Math.random() * 1.5 + 0.5
  xSpeed = 40
  ySpeed = Math.random() * 60 + 50
  corners: Vector2[] = []
  time = Math.random()
  frontColor: string
  backColor: string

  constructor(x: number, y: number, colors: readonly ColorPair[]) {
    this.pos = new Vector2(x, y)
    const ci = Math.round(Math.random() * (colors.length - 1))
    this.frontColor = colors[ci][0]
    this.backColor = colors[ci][1]
    for (let i = 0; i < 4; i++) {
      const dx = Math.cos(this.angle + DEG_TO_RAD * (i * 90 + 45))
      const dy = Math.sin(this.angle + DEG_TO_RAD * (i * 90 + 45))
      this.corners[i] = new Vector2(dx, dy)
    }
  }

  update(dt: number) {
    this.time += dt
    this.rotation += this.rotationSpeed * dt
    this.cosA = Math.cos(DEG_TO_RAD * this.rotation)
    this.pos.x += Math.cos(this.time * this.oscillationSpeed) * this.xSpeed * dt
    this.pos.y += this.ySpeed * dt
    if (this.pos.y > ConfettiPaper.bounds.y) {
      this.pos.x = Math.random() * ConfettiPaper.bounds.x
      this.pos.y = 0
    }
  }

  draw(g: CanvasRenderingContext2D, retina: number) {
    g.fillStyle = this.cosA > 0 ? this.frontColor : this.backColor
    g.beginPath()
    g.moveTo(
      (this.pos.x + this.corners[0].x * this.size) * retina,
      (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina,
    )
    for (let i = 1; i < 4; i++) {
      g.lineTo(
        (this.pos.x + this.corners[i].x * this.size) * retina,
        (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina,
      )
    }
    g.closePath()
    g.fill()
  }
}

class ConfettiRibbon {
  static bounds = new Vector2(0, 0)

  particles: EulerMass[] = []
  frontColor: string
  backColor: string
  xOff: number
  yOff: number
  position: Vector2
  prevPosition: Vector2
  velocityInherit = Math.random() * 2 + 4
  time = Math.random() * 100
  oscillationSpeed = Math.random() * 2 + 2
  oscillationDistance = Math.random() * 40 + 40
  ySpeed = Math.random() * 40 + 80

  constructor(
    x: number,
    y: number,
    private particleCount: number,
    private particleDist: number,
    thickness: number,
    angle: number,
    private particleMass: number,
    private particleDrag: number,
    private colors: readonly ColorPair[],
  ) {
    const ci = Math.round(Math.random() * (colors.length - 1))
    this.frontColor = colors[ci][0]
    this.backColor = colors[ci][1]
    this.xOff = Math.cos(DEG_TO_RAD * angle) * thickness
    this.yOff = Math.sin(DEG_TO_RAD * angle) * thickness
    this.position = new Vector2(x, y)
    this.prevPosition = new Vector2(x, y)
    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i] = new EulerMass(x, y - i * this.particleDist, this.particleMass, this.particleDrag)
    }
  }

  update(dt: number) {
    this.time += dt * this.oscillationSpeed
    this.position.y += this.ySpeed * dt
    this.position.x += Math.cos(this.time) * this.oscillationDistance * dt
    this.particles[0].position = this.position
    const dX = this.prevPosition.x - this.position.x
    const dY = this.prevPosition.y - this.position.y
    const delta = Math.sqrt(dX * dX + dY * dY)
    this.prevPosition = new Vector2(this.position.x, this.position.y)
    for (let i = 1; i < this.particleCount; i++) {
      const dirP = Vector2.sub(this.particles[i - 1].position, this.particles[i].position)
      dirP.normalize()
      dirP.mul((delta / dt) * this.velocityInherit)
      this.particles[i].addForce(dirP)
    }
    for (let i = 1; i < this.particleCount; i++)
      this.particles[i].integrate(dt)
    for (let i = 1; i < this.particleCount; i++) {
      const rp = new Vector2(this.particles[i].position.x, this.particles[i].position.y)
      rp.sub(this.particles[i - 1].position)
      rp.normalize()
      rp.mul(this.particleDist)
      rp.add(this.particles[i - 1].position)
      this.particles[i].position = rp
    }
    if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount)
      this.reset()
  }

  reset() {
    this.position.y = -Math.random() * ConfettiRibbon.bounds.y
    this.position.x = Math.random() * ConfettiRibbon.bounds.x
    this.prevPosition = new Vector2(this.position.x, this.position.y)
    this.velocityInherit = Math.random() * 2 + 4
    this.time = Math.random() * 100
    this.oscillationSpeed = Math.random() * 2 + 1.5
    this.oscillationDistance = Math.random() * 40 + 40
    this.ySpeed = Math.random() * 40 + 80
    const ci = Math.round(Math.random() * (this.colors.length - 1))
    this.frontColor = this.colors[ci][0]
    this.backColor = this.colors[ci][1]
    this.particles = []
    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i] = new EulerMass(
        this.position.x,
        this.position.y - i * this.particleDist,
        this.particleMass,
        this.particleDrag,
      )
    }
  }

  draw(g: CanvasRenderingContext2D, retina: number) {
    for (let i = 0; i < this.particleCount - 1; i++) {
      const p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff)
      const p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff)
      const cur = this.particles[i].position
      const next = this.particles[i + 1].position
      if (this.side(cur.x, cur.y, next.x, next.y, p1.x, p1.y) < 0) {
        g.fillStyle = this.frontColor
        g.strokeStyle = this.frontColor
      }
      else {
        g.fillStyle = this.backColor
        g.strokeStyle = this.backColor
      }
      if (i === 0) {
        g.beginPath()
        g.moveTo(cur.x * retina, cur.y * retina)
        g.lineTo(next.x * retina, next.y * retina)
        g.lineTo(((next.x + p1.x) * 0.5) * retina, ((next.y + p1.y) * 0.5) * retina)
        g.closePath()
        g.stroke()
        g.fill()
        g.beginPath()
        g.moveTo(p1.x * retina, p1.y * retina)
        g.lineTo(p0.x * retina, p0.y * retina)
        g.lineTo(((next.x + p1.x) * 0.5) * retina, ((next.y + p1.y) * 0.5) * retina)
        g.closePath()
        g.stroke()
        g.fill()
      }
      else if (i === this.particleCount - 2) {
        g.beginPath()
        g.moveTo(cur.x * retina, cur.y * retina)
        g.lineTo(next.x * retina, next.y * retina)
        g.lineTo(((cur.x + p0.x) * 0.5) * retina, ((cur.y + p0.y) * 0.5) * retina)
        g.closePath()
        g.stroke()
        g.fill()
        g.beginPath()
        g.moveTo(p1.x * retina, p1.y * retina)
        g.lineTo(p0.x * retina, p0.y * retina)
        g.lineTo(((cur.x + p0.x) * 0.5) * retina, ((cur.y + p0.y) * 0.5) * retina)
        g.closePath()
        g.stroke()
        g.fill()
      }
      else {
        g.beginPath()
        g.moveTo(cur.x * retina, cur.y * retina)
        g.lineTo(next.x * retina, next.y * retina)
        g.lineTo(p1.x * retina, p1.y * retina)
        g.lineTo(p0.x * retina, p0.y * retina)
        g.closePath()
        g.stroke()
        g.fill()
      }
    }
  }

  side(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    return (x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2)
  }
}

export function Confetti({
  durationMs = 6000,
  colors = DEFAULT_COLORS,
}: {
  /** Fade out and stop after this many ms. 0 runs until unmount. */
  durationMs?: number
  colors?: readonly ColorPair[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx)
      return

    const retina = window.devicePixelRatio || 1
    let width = canvas.offsetWidth
    let height = canvas.offsetHeight

    const sizeToParent = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * retina
      canvas.height = height * retina
      ConfettiPaper.bounds = new Vector2(width, height)
      ConfettiRibbon.bounds = new Vector2(width, height)
    }
    sizeToParent()

    const mobile = window.matchMedia(MOBILE_QUERY).matches
    const paperCount = mobile ? MOBILE_PAPER_COUNT : PAPER_COUNT
    const ribbonCount = mobile ? MOBILE_RIBBON_COUNT : RIBBON_COUNT

    const palette = colors.length > 0 ? colors : DEFAULT_COLORS
    const papers = Array.from(
      { length: paperCount },
      () => new ConfettiPaper(Math.random() * width, Math.random() * height, palette),
    )
    const ribbons = Array.from(
      { length: ribbonCount },
      () => new ConfettiRibbon(
        Math.random() * width,
        -Math.random() * height * 2,
        RIBBON_PARTICLE_COUNT,
        RIBBON_PARTICLE_DIST,
        RIBBON_THICKNESS,
        45,
        1,
        0.05,
        palette,
      ),
    )

    let rafId = 0
    const start = Date.now()

    const frame = () => {
      const elapsed = Date.now() - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (durationMs > 0 && elapsed > durationMs + FADE_MS)
        return

      ctx.globalAlpha = durationMs > 0 && elapsed > durationMs
        ? Math.max(0, 1 - (elapsed - durationMs) / FADE_MS)
        : 1

      for (const paper of papers) {
        paper.update(DT)
        paper.draw(ctx, retina)
      }
      for (const ribbon of ribbons) {
        ribbon.update(DT)
        ribbon.draw(ctx, retina)
      }

      rafId = window.requestAnimationFrame(frame)
    }
    rafId = window.requestAnimationFrame(frame)

    window.addEventListener('resize', sizeToParent)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', sizeToParent)
    }
  }, [durationMs, colors])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  )
}
