import { useState, useRef, useCallback, useEffect } from 'react'

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  const observer = useRef<IntersectionObserver | null>(null)

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) {
      observer.current.disconnect()
    }

    ref.current = node

    if (node) {
      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
          }
        },
        { threshold }
      )
      observer.current.observe(node)
    }
  }, [threshold])

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return { ref: setRef, isInView }
}

function formatValue(target: number, suffix: string): string {
  if (target >= 1000) {
    return `${Math.floor(target / 1000)}k${suffix}`
  }
  return `${Math.floor(target)}${suffix}`
}

interface AnimatedCounterProps {
  value: string
  duration?: number
  delay?: number
}

export default function AnimatedCounter({ value, duration = 2000, delay = 0 }: AnimatedCounterProps) {
  const { ref, isInView } = useInView()
  const isStatic = !value.match(/^([\d.]+)/)
  const [displayValue, setDisplayValue] = useState(isStatic ? value : '0')

  useEffect(() => {
    if (!isInView || isStatic) return

    const numMatch = value.match(/^([\d.]+)/)
    if (!numMatch) return

    const target = parseFloat(numMatch[1])
    const suffix = value.replace(numMatch[1], '')
    const startTime = Date.now() + delay

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed < 0) {
        requestAnimationFrame(animate)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target

      setDisplayValue(formatValue(current, suffix))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value, duration, delay, isStatic])

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
    </span>
  )
}
