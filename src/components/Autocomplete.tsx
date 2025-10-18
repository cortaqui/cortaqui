"use client"
import { useEffect, useState } from "react"
import { Input } from "~/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

export type Suggestion = { id: string; name: string; email?: string; phone?: string; imageUrl?: string }

export function Autocomplete({
  value,
  onChange,
  onSelect,
  searchApi,
  label,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  onSelect: (s: Suggestion) => void
  searchApi: string
  label?: string
  placeholder?: string
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const q = value.trim()
    const url = q.length < 2 ? `${searchApi}?limit=2` : `${searchApi}?q=${encodeURIComponent(q)}&limit=10`
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(url, { signal: controller.signal })
          if (!res.ok) return
          const data = (await res.json()) as { users?: Suggestion[] }
          setSuggestions(Array.isArray(data.users) ? data.users : [])
        } catch {}
      })()
    }, 250)
    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [value, searchApi])

  return (
    <div className="grid gap-2">
      {label && <label className="text-sm font-medium" htmlFor="autocomplete-input">{label}</label>}
      <div className="relative">
        <Input
          id="autocomplete-input"
          value={value}
          onChange={(e) => { onChange(e.target.value); setShow(true) }}
          onFocus={() => setShow(true)}
          placeholder={placeholder}
          required
          autoComplete="off"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 shadow">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 hover:bg-accent"
                onClick={() => { onSelect(s); setShow(false) }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={s.imageUrl} />
                  <AvatarFallback>{s.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium leading-none">{s.name}</div>
                  {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
        {show && value.trim().length >= 2 && suggestions.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-2 text-sm text-muted-foreground shadow">
            Nenhum resultado
          </div>
        )}
        {show && (
          <div className="h-28" aria-hidden />
        )}
      </div>
    </div>
  )
}
