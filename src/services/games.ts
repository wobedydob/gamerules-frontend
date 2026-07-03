import { api } from './api'
import type { GameDetail, GameSummary, GameWrite } from './types'

export const gamesApi = {
  async list(search?: string): Promise<GameSummary[]> {
    const { data } = await api.get<GameSummary[]>('/games', {
      params: search ? { search } : undefined,
    })
    return data
  },

  async getBySlug(slug: string): Promise<GameDetail> {
    const { data } = await api.get<GameDetail>(`/games/${slug}`)
    return data
  },

  async create(payload: GameWrite): Promise<GameDetail> {
    const { data } = await api.post<GameDetail>('/games', payload)
    return data
  },

  async update(id: number, payload: GameWrite): Promise<GameDetail> {
    const { data } = await api.put<GameDetail>(`/games/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/games/${id}`)
  },
}
