// Generic deeplink validation utilities

type Kind = "addr" | "int" | "dec" | "str"
type Spec<T extends Record<string, Kind>> = T

const one = (v: unknown) => Array.isArray(v) ? v[0] : v ?? ""
const addrRe = /^0x[0-9a-fA-F]{40}$/
const intRe = /^\d+$/
const decRe = /^\d+(\.\d+)?$/

export function validate<T extends Record<string, Kind>>(
  query: Record<string, unknown>,
  spec: Spec<T>,
  extra?: (out: Record<string, string>) => boolean
): null | Record<string, string> {
  const out: Record<string, string> = {}
  
  for (const k in spec) {
    const raw = String(one(query[k]))
    if (!raw) return null
    
    const ok =
      spec[k] === "addr" ? addrRe.test(raw) :
      spec[k] === "int" ? intRe.test(raw) :
      spec[k] === "dec" ? decRe.test(raw) :
      true
    
    if (!ok) return null
    out[k] = raw
  }
  
  if (extra && !extra(out)) return null
  return out
}