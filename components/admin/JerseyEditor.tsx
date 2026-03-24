'use client'

import { JerseySvg } from '@/components/jersey/JerseySvg'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JerseyEditorValue {
  primaryColor: string
  secondaryColor: string
}

interface JerseyEditorProps {
  value: JerseyEditorValue
  onChange: (next: JerseyEditorValue) => void
}

// ─── Preset Colors ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#1D4ED8', '#DC2626', '#16A34A', '#9333EA', '#EA580C',
  '#0891B2', '#DB2777', '#65A30D', '#CA8A04', '#475569',
  '#ffffff', '#111827',
]

// ─── Color Swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({
  color,
  selected,
  onSelect,
}: {
  color: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center shrink-0 border ${
        selected
          ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1E2032] scale-110 shadow-lg border-white/40'
          : 'opacity-70 hover:opacity-100 scale-90 border-white/10'
      }`}
      style={{ backgroundColor: color }}
      aria-label={color}
    />
  )
}

// ─── Hex Input ────────────────────────────────────────────────────────────────

function HexInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2 bg-[#181928] border border-white/10 rounded-lg px-3 py-2">
        <div
          className="w-5 h-5 rounded-full border border-white/20 shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-white text-sm flex-1 min-w-0 focus:outline-none"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── JerseyEditor ─────────────────────────────────────────────────────────────

/**
 * Client component — admin jersey colour editor with live preview.
 * Designed for use inside OrganiseCreateSheet and team edit forms.
 */
export function JerseyEditor({ value, onChange }: JerseyEditorProps) {
  const update = (patch: Partial<JerseyEditorValue>) =>
    onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
      <label className="block text-gray-300 text-sm font-medium ml-1">Kit Design</label>

      {/* Live Preview */}
      <div className="flex items-center justify-center py-3">
        <JerseySvg
          primaryColor={value.primaryColor}
          secondaryColor={value.secondaryColor}
          width={80}
          height={93}
        />
      </div>

      {/* Primary colour */}
      <div className="space-y-2">
        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Primary Colour</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              selected={value.primaryColor === c}
              onSelect={() => update({ primaryColor: c })}
            />
          ))}
        </div>
        <HexInput
          label="Custom hex"
          value={value.primaryColor}
          onChange={(v) => update({ primaryColor: v })}
        />
      </div>

      {/* Secondary colour */}
      <div className="space-y-2">
        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Secondary Colour</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              selected={value.secondaryColor === c}
              onSelect={() => update({ secondaryColor: c })}
            />
          ))}
        </div>
        <HexInput
          label="Custom hex"
          value={value.secondaryColor}
          onChange={(v) => update({ secondaryColor: v })}
        />
      </div>
    </div>
  )
}

export default JerseyEditor
