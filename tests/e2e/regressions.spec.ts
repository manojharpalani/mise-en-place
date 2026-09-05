import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Static, no-browser regression guards for the two root-cause bugs fixed in
 * this app this session. Both are the kind of mistake that's trivial to
 * reintroduce (paste a handler prop into a Server Component; typo/guess a
 * model id) and easy to miss in review, so they're enforced here rather than
 * only covered indirectly by a UI test.
 */

const SRC_DIR = join(__dirname, '..', '..', 'src')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const ALL_SRC_FILES = walk(SRC_DIR)

test.describe('static regression guards', () => {
  test('no Server Component passes a raw DOM event-handler prop', () => {
    // Regression guard for: "Event handlers cannot be passed to Client
    // Component props" crash on /buyer/orders, fixed by extracting the
    // interactive bits into order-card-interactive.tsx.
    //
    // Heuristic: a .tsx file with no 'use client' directive in its first
    // few lines, that assigns on[A-Z]... to a lowercase (plain DOM) JSX tag,
    // is almost certainly this bug. We deliberately do NOT flag handlers on
    // capitalized (component) tags, since a Server Component is allowed to
    // pass an onClick through to a Client Component it renders.
    const offenders: string[] = []
    const handlerOnDomTag = /<([a-z][a-zA-Z0-9]*)\b[^>]*?\bon[A-Z]\w*=\{/g

    for (const file of ALL_SRC_FILES.filter((f) => f.endsWith('.tsx'))) {
      const content = readFileSync(file, 'utf8')
      const firstLines = content.split('\n').slice(0, 5).join('\n')
      if (/['"]use client['"]/.test(firstLines)) continue // client component, exempt

      let match: RegExpExecArray | null
      handlerOnDomTag.lastIndex = 0
      while ((match = handlerOnDomTag.exec(content))) {
        offenders.push(`${file}: <${match[1]} ... on...={...}>`)
      }
    }

    expect(offenders, `Server Components with a raw DOM event handler:\n${offenders.join('\n')}`).toEqual([])
  })

  test('every Anthropic model id is a real, known model', () => {
    // Regression guard for: every AI feature silently failing because
    // 'claude-fable-5' (not a real model) was hardcoded across 5 routes.
    const KNOWN_MODELS = [
      'claude-3-haiku-20240307',
      'claude-haiku-4-5',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-0',
      'claude-opus-4-1',
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-opus-4-5',
      'claude-opus-4-5-20251101',
      'claude-opus-4-6',
      'claude-sonnet-4-0',
      'claude-sonnet-4-20250514',
      'claude-sonnet-4-5',
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-6',
    ]

    const offenders: string[] = []
    const modelRef = /model:\s*['"]([\w.-]+)['"]/g

    // Scope this to files that actually talk to the Anthropic SDK — the
    // codebase also calls OpenAI's images API (model: 'dall-e-3'), which is
    // correct and not this bug.
    for (const file of ALL_SRC_FILES.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
      const content = readFileSync(file, 'utf8')
      if (!content.includes("@/lib/anthropic")) continue

      let match: RegExpExecArray | null
      modelRef.lastIndex = 0
      while ((match = modelRef.exec(content))) {
        if (!KNOWN_MODELS.includes(match[1])) {
          offenders.push(`${file}: model: '${match[1]}'`)
        }
      }
    }

    expect(offenders, `Unknown/invalid Anthropic model ids:\n${offenders.join('\n')}`).toEqual([])
  })
})
