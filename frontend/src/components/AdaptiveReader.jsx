import { useState, useCallback } from 'react'

// Client-side bionic: bold first 40% of each word
function clientBionic(text) {
  return text.replace(/\b(\w+)\b/g, (_, w) => {
    const mid = Math.ceil(w.length * 0.4)
    return `<strong>${w.slice(0, mid)}</strong>${w.slice(mid)}`
  })
}

const SAMPLE =
  'Cognitive architecture refers to both a theory about the structure of the human mind ' +
  'and to a computational instantiation of such a theory, often used in the fields of ' +
  'artificial intelligence and computational cognitive science.\n\n' +
  'The primary goal of these models is to provide a comprehensive framework that ' +
  'encapsulates the fundamental mechanisms of thought, learning, and decision-making. ' +
  'By simulating human cognition, researchers aim to uncover the underlying principles of intelligence.'

export default function AdaptiveReader({ apiOnline }) {
  const [bionicMode, setBionicMode]   = useState(true)
  const [rawText, setRawText]         = useState(SAMPLE)
  const [bionicHtml, setBionicHtml]   = useState(() => clientBionic(SAMPLE))
  const [fontSize, setFontSize]       = useState(14)
  const [loading, setLoading]         = useState(false)

  const process = useCallback(async (text) => {
    const src = text ?? rawText
    if (!src.trim()) { setBionicHtml(''); return }
    setLoading(true)
    if (apiOnline) {
      try {
        const res = await fetch('/api/focus/process-reader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(src),
        })
        if (res.ok) {
          const { html } = await res.json()
          setBionicHtml(html)
          setLoading(false)
          return
        }
      } catch { /* fallthrough */ }
    }
    setBionicHtml(clientBionic(src))
    setLoading(false)
  }, [rawText, apiOnline])

  const handleToggle = (e) => {
    const on = e.target.checked
    setBionicMode(on)
    if (on) process(rawText)
  }

  const handleTextChange = (e) => {
    setRawText(e.target.value)
    if (bionicMode) process(e.target.value)
  }

  // render body based on mode
  const bodyStyle = { fontSize: `${fontSize}px` }

  return (
    <>
      {/* Header */}
      <div className="reader-card-header">
        <div className="reader-card-left">
          <span className="reader-icon" aria-hidden="true">👁</span>
          <h2 className="reader-title">Literature Review</h2>
        </div>
        <div className="reader-card-right">
          <span className="bionic-label">Bionic Mode</span>
          <label className="toggle" aria-label="Toggle Bionic Mode">
            <input
              id="bionic-toggle"
              type="checkbox"
              checked={bionicMode}
              onChange={handleToggle}
            />
            <span className="toggle-track" />
          </label>
        </div>
      </div>

      {/* Body text */}
      <div
        id="reader-output"
        className="bionic-body"
        style={bodyStyle}
        role="region"
        aria-live="polite"
        aria-label="Processed reading output"
      >
        {bionicMode && bionicHtml
          ? <span dangerouslySetInnerHTML={{ __html: bionicHtml }} />
          : <span className="bionic-plain">{rawText || 'Paste text below to begin…'}</span>
        }
      </div>

      {/* Input row */}
      <div className="bionic-input-row">
        <textarea
          id="reader-input"
          className="neu-input"
          style={{ borderRadius: '12px', minHeight: '64px', resize: 'vertical', fontSize: '0.85rem' }}
          placeholder="Paste or type text here…"
          value={rawText}
          onChange={handleTextChange}
          aria-label="Text input for bionic reader"
        />
      </div>

      {/* Font size slider */}
      <div className="font-size-row">
        <span className="font-size-icon" aria-hidden="true">A-</span>
        <input
          id="font-size-slider"
          type="range"
          className="range-input"
          min="11"
          max="22"
          value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          aria-label={`Font size: ${fontSize}px`}
        />
        <span className="font-size-icon lg" aria-hidden="true">A+</span>
      </div>
    </>
  )
}
