// Thin bankd client. The IAM SDK owns the access token (sessionStorage); this
// client only reads it and attaches the Bearer. Endpoints follow bankd:
//   GET  /v1/collections/{col}/records         (Base CRUD)
//   GET  /v1/bank/accounts/{id}/balances       (custom route)
//   PATCH/POST for sandbox-safe admin actions.
import { IAM_TOKEN_KEY } from './iam'

export const API_BASE = (import.meta.env.VITE_BANK_API_URL as string) || 'https://api.lux.financial'

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(IAM_TOKEN_KEY)
  } catch {
    return null
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>)
    const msg = (body as { message?: string; error?: string }).message ||
      (body as { error?: string }).error ||
      `Request failed: ${res.status}`
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface ListResult<T> {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

export interface ListParams {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
  expand?: string
}

function buildQuery(params?: ListParams): string {
  if (!params) return ''
  const parts: string[] = []
  if (params.page) parts.push(`page=${params.page}`)
  if (params.perPage) parts.push(`perPage=${params.perPage}`)
  if (params.sort) parts.push(`sort=${encodeURIComponent(params.sort)}`)
  if (params.filter) parts.push(`filter=${encodeURIComponent(params.filter)}`)
  if (params.expand) parts.push(`expand=${encodeURIComponent(params.expand)}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export function listRecords<T = Record<string, unknown>>(
  collection: string,
  params?: ListParams,
): Promise<ListResult<T>> {
  return request(`/v1/collections/${collection}/records${buildQuery(params)}`)
}

export function updateRecord<T = Record<string, unknown>>(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<T> {
  return request(`/v1/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function getAccountBalances(
  accountId: string,
): Promise<{ currency: string; available: number; held: number }[]> {
  return request(`/v1/bank/accounts/${accountId}/balances`)
}

export function health(): Promise<{ status: string }> {
  return request('/v1/bank/health')
}
