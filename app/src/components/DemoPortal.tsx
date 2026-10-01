/**
 * "Try with demo data": opens the bundled demo copy of a portal (public/demo) full-screen
 * inside GoScheme and runs the same auto-fill script the real portal gets. Works offline,
 * in the Android app and in a browser, so the expo demo never depends on a live site.
 */
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { buildAutofillScript, type AutofillConfig } from '../portal/autofill'

type Props = { src: string; title: string; cfg: AutofillConfig; onClose: () => void }

export function DemoPortal({ src, title, cfg, onClose }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)

  const inject = () => {
    const win = frame.current?.contentWindow as (Window & { eval: (code: string) => void }) | null | undefined
    try {
      win?.eval(buildAutofillScript(cfg))
    } catch {
      // The page is our own file, so this only fails if it did not load.
    }
  }

  return (
    <motion.div className="demo-portal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
      <div className="demo-portal-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <b>{title}</b>
        <span className="demo-pill">DEMO</span>
      </div>
      <iframe ref={frame} src={`${import.meta.env.BASE_URL}${src}`} title={title} onLoad={inject} />
    </motion.div>
  )
}
