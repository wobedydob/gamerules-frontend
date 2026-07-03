export interface GameSummary {
  id: number
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  playTimeMinutes: number | null
}

export interface Item {
  id: number
  title: string
  body: string
  sortOrder: number
}

export type SectionType = 'list' | 'cards'

export interface Section {
  id: number
  title: string
  type: SectionType
  body: string | null
  sortOrder: number
  items: Item[]
}

export interface GameDetail extends GameSummary {
  createdByDisplayName: string | null
  updatedAt: string
  sections: Section[]
}

// ---- Write models ----

export interface ItemWrite {
  title: string
  body: string
  sortOrder: number
}

export interface SectionWrite {
  title: string
  type: SectionType
  body: string | null
  sortOrder: number
  items: ItemWrite[]
}

export interface GameWrite {
  name: string
  description: string | null
  imageUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  playTimeMinutes: number | null
  sections: SectionWrite[]
}

// ---- Auth ----

export interface AuthResponse {
  token: string
  email: string
  displayName: string
  roles: string[]
}
