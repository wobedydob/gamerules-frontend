import type { Component } from 'vue'
import {
  BookOpen,
  Dices,
  Flag,
  Layers,
  Puzzle,
  RotateCw,
  Star,
  Target,
  Trophy,
} from 'lucide-vue-next'

interface SectionKind {
  icon: Component
  /** True for card-grid rendering ("Kaarten" sections). */
  isCards: boolean
}

// Ordered: first keyword that matches the (lowercased) section title wins.
const RULES: Array<{ match: string[]; icon: Component; isCards?: boolean }> = [
  { match: ['kaart'], icon: Layers, isCards: true },
  { match: ['doel', 'win'], icon: Target },
  { match: ['opzet', 'setup', 'voorbereid'], icon: Puzzle },
  { match: ['beurt', 'ronde', 'zo speel', 'spelverloop'], icon: RotateCw },
  { match: ['speciale', 'special', 'uitzonder'], icon: Star },
  { match: ['punt', 'score', 'tellen'], icon: Trophy },
  { match: ['einde', 'end', 'slot'], icon: Flag },
  { match: ['dobbel', 'worp'], icon: Dices },
]

export function sectionKind(title: string): SectionKind {
  const t = title.toLowerCase()
  for (const rule of RULES) {
    if (rule.match.some((m) => t.includes(m))) {
      return { icon: rule.icon, isCards: rule.isCards ?? false }
    }
  }
  return { icon: BookOpen, isCards: false }
}
