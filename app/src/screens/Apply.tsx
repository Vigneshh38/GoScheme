import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CircleAlert, FolderCheck, Globe, Mic, Pencil, ScanText, User } from 'lucide-react'
import { Button, IconTile, Sheet, Toast, TopBar } from '../components/ui'
import { VoicePrompt } from '../components/VoicePrompt'
import { AnswerInput } from '../components/AnswerInput'
import { DOCS, schemeById, type DocId, type FieldDef, type FieldSource } from '../data/schemes'
import { readDocument } from '../lib/ocr'
import { parseFreeText } from '../lib/parse'
import { useApp, newId } from '../state'
import { PortalSheet } from '../components/PortalSheet'
import { portalFor } from '../portal/portals'
import { portalValues } from '../portal/values'

type Filled = { value: string; confirmed: boolean }
type Props = { schemeId: string; memberId: string; onBack: () => void; onCreated: (formId: string) => void }

const SOURCE_ICON: Record<FieldSource, typeof User> = { profile: User, document: ScanText, voice: Mic }

export function Apply({ schemeId, memberId, onBack, onCreated }: Props) {
  const { state, t, pick, lang, dispatch } = useApp()
  const scheme = schemeById(schemeId)!
  const member = state.members.find((m) => m.id === memberId)!
  const fields = scheme.fields

  // Profile answers are known already; they "fill in" one by one when the screen opens.
  const profileValues = useMemo(() => {
    const out: Record<string, Filled> = {}
    for (const f of fields) {
      if (f.source !== 'profile') continue
      const v = f.fromProfile?.(member, state.household, lang)
      if (v) out[f.id] = { value: v, confirmed: true }
    }
    return out
  }, [fields, member, state.household, lang])

  const [filled, setFilled] = useState<Record<string, Filled>>({})
  const [revealed, setRevealed] = useState(0)
  const [scanning, setScanning] = useState<DocId | null>(null)
  const [asking, setAsking] = useState<FieldDef | null>(null)
  const [editing, setEditing] = useState<FieldDef | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const portal = portalFor(schemeId)
  const flash = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2600) }

  const profileIds = fields.filter((f) => f.source === 'profile').map((f) => f.id)
  useEffect(() => {
    if (revealed >= profileIds.length) return
    const id = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 450 : 220)
    return () => clearTimeout(id)
  }, [revealed, profileIds.length])

  const valueOf = (f: FieldDef): Filled | undefined => {
    if (f.source === 'profile') return profileIds.indexOf(f.id) < revealed ? profileValues[f.id] : undefined
    return filled[f.id]
  }

  const total = fields.length
  const done = fields.filter((f) => valueOf(f)).length
  const unconfirmed = fields.filter((f) => valueOf(f) && !valueOf(f)!.confirmed).length
  const ready = done === total && unconfirmed === 0

  const setMany = (values: Record<string, string>, confirmed: boolean) =>
    setFilled((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(values)) next[k] = { value: v, confirmed }
      return next
    })

  const create = () => {
    const form = {
      id: newId(),
      schemeId,
      memberId,
      createdAt: Date.now(),
      fields: fields.map((f) => ({ label: pick(f.label), value: valueOf(f)!.value })),
      documents: scheme.documents.map((d) => pick(DOCS[d])),
    }
    dispatch({ type: 'addForm', form })
    onCreated(form.id)
  }

  const scanFields = scanning ? fields.filter((f) => f.doc === scanning) : []

  return (
    <div className="screen">
      <TopBar onBack={onBack} title={<span className="topbar-text">{t('reviewTitle')}</span>} />
      <div className="body apply">
        <div className="apply-head">
          <IconTile icon={scheme.icon} tone={scheme.tone} />
          <div className="apply-head-mid">
            <b>{pick(scheme.name)} · {member.name}</b>
            <span>{t('fieldsFilled', { a: done, b: total })}</span>
            <span className="bar"><motion.i animate={{ width: `${(done / total) * 100}%` }} transition={{ type: 'spring', damping: 20 }} /></span>
          </div>
        </div>

        <div className="legend">
          <span className="src src--profile"><User size={12} />{t('srcProfile')}</span>
          <span className="src src--document"><ScanText size={12} />{t('srcDocument')}</span>
          <span className="src src--voice"><Mic size={12} />{t('srcVoice')}</span>
        </div>

        <div className="fields">
          {fields.map((f) => {
            const v = valueOf(f)
            const Icon = SOURCE_ICON[f.source]
            const pendingProfile = f.source === 'profile' && !v
            return (
              <div key={f.id} className={`f${v && !v.confirmed ? ' f--check' : ''}`}>
                <div className="f-mid">
                  <span className="f-label">{pick(f.label)}</span>
                  {v ? (
                    <motion.span className="f-value" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>{v.value}</motion.span>
                  ) : pendingProfile ? (
                    <span className="f-skeleton" />
                  ) : f.source === 'document' ? (
                    <button type="button" className="f-action" onClick={() => setScanning(f.doc!)}>
                      <Camera size={16} /> {t('scanDoc', { doc: pick(DOCS[f.doc!]) })}
                    </button>
                  ) : (
                    <button type="button" className="f-action" onClick={() => setAsking(f)}>
                      <Mic size={16} /> {t('askByVoice')}
                    </button>
                  )}
                  {v && !v.confirmed && (
                    <span className="f-ask"><CircleAlert size={13} /> {t('readFromPhoto')}</span>
                  )}
                </div>
                <div className="f-side">
                  <span className={`src src--${f.source}`}><Icon size={12} />{t(f.source === 'profile' ? 'srcProfile' : f.source === 'document' ? 'srcDocument' : 'srcVoice')}</span>
                  {v && !v.confirmed ? (
                    <button type="button" className="f-confirm" onClick={() => setFilled((p) => ({ ...p, [f.id]: { ...p[f.id], confirmed: true } }))}>
                      {t('confirm')}
                    </button>
                  ) : v && f.source !== 'profile' ? (
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => setEditing(f)} aria-label={`${t('edit')} ${pick(f.label)}`}>
                      <Pencil size={15} />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className="carry">
          <FolderCheck size={18} />
          <p><b>{t('carry')}:</b> {scheme.documents.map((d) => pick(DOCS[d])).join(', ')}</p>
        </div>
      </div>

      <footer className="footer">
        {portal && (
          // The portal's first step needs only a few details, so this works before every field is done.
          <Button block icon={Globe} onClick={() => setPortalOpen(true)}>{t('fillOfficial')}</Button>
        )}
        <Button block variant={portal ? 'secondary' : 'primary'} onClick={create} disabled={!ready}>
          {ready ? t('createForm') : done < total ? t('finishFields', { n: total - done }) : t('confirmFields', { n: unconfirmed })}
        </Button>
      </footer>

      {portal && (
        <PortalSheet
          open={portalOpen}
          onClose={() => setPortalOpen(false)}
          portal={portal}
          values={portalValues(member, state.household, Object.fromEntries(Object.entries(filled).map(([k, v]) => [k, v.value])))}
        />
      )}

      <Sheet open={!!scanning} onClose={() => setScanning(null)} label={t('scanTitle', { doc: scanning ? pick(DOCS[scanning]) : '' })}>
        {scanning && (
          <ScanPanel
            doc={scanning}
            fields={scanFields}
            onDone={(values, message) => { setMany(values, false); setScanning(null); if (message) flash(message) }}
          />
        )}
      </Sheet>

      <Sheet open={!!asking} onClose={() => setAsking(null)} label={t('askByVoice')}>
        {asking?.voice && (
          <div className="sheet-body">
            <VoicePrompt
              id={`field:${asking.id}`}
              prompt={pick(asking.voice.ask)}
              kind={asking.voice.numeric ? 'number' : 'text'}
              numeric={asking.voice.numeric}
              parse={asking.voice.parse}
              onAnswer={(value) => { setMany({ [asking.id]: String(value) }, true); setAsking(null) }}
            />
          </div>
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} label={t('edit')}>
        {editing && (
          <div className="sheet-body">
            <h2 className="h2">{pick(editing.label)}</h2>
            <AnswerInput
              kind={editing.voice?.numeric ? 'number' : 'text'}
              numeric={editing.voice?.numeric}
              parse={editing.voice?.parse ?? parseFreeText}
              initial={filled[editing.id]?.value.includes('X') ? '' : filled[editing.id]?.value}
              onSubmit={(value) => { setMany({ [editing.id]: String(value) }, true); setEditing(null) }}
            />
          </div>
        )}
      </Sheet>
      <Toast text={toast} />
    </div>
  )
}

function ScanPanel({ doc, fields, onDone }: { doc: DocId; fields: FieldDef[]; onDone: (values: Record<string, string>, message?: string) => void }) {
  const { t, pick } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docName = pick(DOCS[doc])

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      const found = await readDocument(file, doc, setProgress)
      const missing = fields.filter((f) => !found[f.id])
      if (Object.keys(found).length === 0) {
        setProgress(null)
        setError(t('ocrNotFound', { what: missing.map((f) => pick(f.label)).join(', ') }))
        return
      }
      onDone(found, missing.length ? t('ocrNotFound', { what: missing.map((f) => pick(f.label)).join(', ') }) : t('photoDeleted'))
    } catch {
      setProgress(null)
      setError(t('ocrFailed'))
    } finally {
      // Drop the photo: clear the input so the browser releases the file.
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="sheet-body scan">
      <span className="scan-ic"><ScanText size={30} /></span>
      <h2 className="h2">{t('scanTitle', { doc: docName })}</h2>
      <p className="lead">{t('scanLead')}</p>
      {progress !== null ? (
        <div className="scan-progress">
          <span>{t('reading')}</span>
          <span className="bar"><motion.i animate={{ width: `${Math.max(8, progress * 100)}%` }} /></span>
        </div>
      ) : (
        <>
          {error && <p className="input-error">{error}</p>}
          <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <Button block icon={Camera} onClick={() => input.current?.click()}>{t('takePhoto')}</Button>
          <Button block variant="ghost" onClick={() => onDone(Object.fromEntries(fields.map((f) => [f.id, f.demo])), t('demoAdded'))}>
            {t('useDemo')}
          </Button>
        </>
      )}
    </div>
  )
}
