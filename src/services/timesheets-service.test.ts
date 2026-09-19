import { describe, expect, it } from 'vitest'
import { createTimesheetsStore, registerTimesheetsMockRoutes } from '../mocks/timesheets-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { TimesheetsService } from './timesheets-service'

const NOW = () => new Date('2026-09-19T12:00:00.000Z')

function setup() {
  const adapter = new MockServiceAdapter()
  const store = createTimesheetsStore()
  registerTimesheetsMockRoutes(adapter, NOW, store)
  return { service: new TimesheetsService(adapter), store }
}

describe('TimesheetsService', () => {
  it('lists timesheets ordered by year, month and sequence descending', async () => {
    const { service } = setup()
    const response = await service.list({ pageSize: 50 })

    expect(response.pagination.totalItems).toBe(10)
    const keys = response.data.map((item) => `${item.year}-${item.month}-${item.sequence}`)
    expect(keys.slice(0, 4)).toEqual(['2026-9-2', '2026-9-1', '2026-9-1', '2026-9-1'])
    expect(keys.at(-1)).toBe('2026-7-1')
  })

  it('filters by period, status and employee', async () => {
    const { service } = setup()
    const response = await service.list({ month: 9, year: 2026, status: 'PENDING' })

    expect(response.data.length).toBeGreaterThan(0)
    expect(response.data.every((item) => item.month === 9 && item.year === 2026 && item.status === 'PENDING')).toBe(true)
  })

  it('searches partially by file name and employee legajo', async () => {
    const { service } = setup()
    const byFile = await service.list({ search: 'anexo' })
    const byLegajo = await service.list({ search: 'emp-024' })

    expect(byFile.data).toHaveLength(1)
    expect(byFile.data[0]!.fileName).toContain('anexo')
    expect(byLegajo.data.every((item) => item.employee.employeeId === 'EMP-024')).toBe(true)
    expect(byLegajo.data.length).toBeGreaterThan(0)
  })

  it('creates one timesheet per file with incremental sequence and PENDING status', async () => {
    const { service } = setup()
    const result = await service.create({
      employeeId: '22000000-0000-4000-8000-000000000001',
      workplaceId: '44000000-0000-4000-8000-000000000001',
      month: 9,
      year: 2026,
      files: [
        { fileName: 'nueva-planilla.pdf', fileSizeBytes: 120_000 },
        { fileName: 'nueva-planilla-anexo.png', fileSizeBytes: 240_000 },
      ],
    })

    expect(result.created).toHaveLength(2)
    expect(result.created.map((item) => item.sequence)).toEqual([3, 4])
    expect(result.created.every((item) => item.status === 'PENDING')).toBe(true)
    expect(result.created.every((item) => item.uploadedBy.firstName === 'Marina')).toBe(true)
  })

  it('rejects the whole batch when one file is invalid', async () => {
    const { service, store } = setup()
    const before = store.items.length

    await expect(service.create({
      employeeId: '22000000-0000-4000-8000-000000000001',
      workplaceId: '44000000-0000-4000-8000-000000000001',
      month: 9,
      year: 2026,
      files: [
        { fileName: 'valida.pdf', fileSizeBytes: 100 },
        { fileName: 'grande.pdf', fileSizeBytes: 21 * 1024 * 1024 },
      ],
    })).rejects.toMatchObject({ code: 'FILE_TOO_LARGE', status: 422 })

    expect(store.items).toHaveLength(before)
  })

  it('rejects disallowed extensions and unknown relations', async () => {
    const { service } = setup()
    const base = { month: 9, year: 2026, files: [{ fileName: 'planilla.exe', fileSizeBytes: 100 }] }

    await expect(service.create({ ...base, employeeId: '22000000-0000-4000-8000-000000000001', workplaceId: '44000000-0000-4000-8000-000000000001' })).rejects.toMatchObject({ code: 'FILE_EXTENSION_NOT_ALLOWED' })
    await expect(service.create({ employeeId: '22000000-0000-4000-8000-000000000099', workplaceId: '44000000-0000-4000-8000-000000000001', month: 9, year: 2026, files: [{ fileName: 'ok.pdf', fileSizeBytes: 100 }] })).rejects.toMatchObject({ code: 'TIMESHEET_RELATION_NOT_FOUND', status: 422 })
  })

  it('changes status and refreshes updatedAt', async () => {
    const { service } = setup()
    const updated = await service.setStatus('66000000-0000-4000-8000-000000000002', 'LOADED')

    expect(updated.status).toBe('LOADED')
    expect(updated.updatedAt).toBe('2026-09-19T12:00:00.000Z')
    await expect(service.setStatus('66000000-0000-4000-8000-000000000099', 'LOADED')).rejects.toMatchObject({ code: 'TIMESHEET_NOT_FOUND', status: 404 })
  })

  it('replaces the file keeping status and sequence', async () => {
    const { service } = setup()
    const before = await service.get('66000000-0000-4000-8000-000000000004')
    const updated = await service.replaceFile(before.id, { file: { fileName: 'planilla-fernandez-legible.pdf', fileSizeBytes: 300_000 } })

    expect(updated.fileName).toBe('planilla-fernandez-legible.pdf')
    expect(updated.fileExtension).toBe('pdf')
    expect(updated.status).toBe(before.status)
    expect(updated.sequence).toBe(before.sequence)
    expect(updated.updatedAt).toBe('2026-09-19T12:00:00.000Z')
  })

  it('issues a download URL that expires in 15 minutes', async () => {
    const { service } = setup()
    const download = await service.getDownload('66000000-0000-4000-8000-000000000001')

    expect(download.downloadUrl.length).toBeGreaterThan(0)
    expect(new Date(download.expiresAt).getTime() - NOW().getTime()).toBe(15 * 60 * 1000)
  })
})
