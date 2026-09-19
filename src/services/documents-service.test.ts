import { describe, expect, it } from 'vitest'
import { createDocumentsStore, registerDocumentsMockRoutes } from '../mocks/documents-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { DocumentsService } from './documents-service'

const NOW = () => new Date('2026-09-19T12:00:00.000Z')

function setup() {
  const adapter = new MockServiceAdapter()
  const store = createDocumentsStore()
  registerDocumentsMockRoutes(adapter, NOW, store)
  return { service: new DocumentsService(adapter), store }
}

describe('DocumentsService', () => {
  it('lists documents ordered by creation date descending', async () => {
    const { service } = setup()
    const response = await service.list({ pageSize: 50 })

    expect(response.pagination.totalItems).toBe(12)
    expect(response.data[0]!.fileName).toBe('dni-benitez.pdf')
    expect(response.data.at(-1)!.fileName).toBe('contrato-benitez-2021.pdf')
  })

  it('filters by type, employee and upload date range', async () => {
    const { service } = setup()
    const byType = await service.list({ type: 'MEDICAL_CERTIFICATE' })
    const byRange = await service.list({ uploadedFrom: '2026-09-01', uploadedTo: '2026-09-30' })

    expect(byType.data).toHaveLength(2)
    expect(byType.data.every((item) => item.type === 'MEDICAL_CERTIFICATE')).toBe(true)
    expect(byRange.data.length).toBeGreaterThan(0)
    expect(byRange.data.every((item) => item.createdAt.slice(0, 10) >= '2026-09-01' && item.createdAt.slice(0, 10) <= '2026-09-30')).toBe(true)
  })

  it('searches partially by file name, employee name and uploader', async () => {
    const { service } = setup()
    const byFile = await service.list({ search: 'certificado' })
    const byEmployee = await service.list({ search: 'gomez' })
    const byUploader = await service.list({ uploadedBy: 'marina' })

    expect(byFile.data).toHaveLength(2)
    expect(byEmployee.data.every((item) => item.employee.lastName === 'Gómez')).toBe(true)
    expect(byUploader.data.every((item) => item.uploadedBy.firstName === 'Marina')).toBe(true)
  })

  it('creates one document per file with optional workplace', async () => {
    const { service } = setup()
    const result = await service.create({
      employeeId: '22000000-0000-4000-8000-000000000002',
      type: 'ART',
      workplaceId: null,
      files: [{ fileName: 'art-benitez-actualizado.pdf', fileSizeBytes: 500_000 }],
    })

    expect(result.created).toHaveLength(1)
    expect(result.created[0]).toMatchObject({ type: 'ART', workplace: null, fileExtension: 'pdf' })
    expect(result.created[0]!.uploadedBy.firstName).toBe('Marina')
  })

  it('rejects invalid batches and types atomically', async () => {
    const { service, store } = setup()
    const before = store.items.length

    await expect(service.create({
      employeeId: '22000000-0000-4000-8000-000000000002',
      type: 'DNI',
      workplaceId: null,
      files: [{ fileName: 'dni.gif', fileSizeBytes: 100 }],
    })).rejects.toMatchObject({ code: 'FILE_EXTENSION_NOT_ALLOWED', status: 422 })

    expect(store.items).toHaveLength(before)
  })

  it('updates only the visible name and type', async () => {
    const { service } = setup()
    const before = await service.get('77000000-0000-4000-8000-000000000005')
    const updated = await service.update(before.id, { fileName: 'certificado-medico-alvarez-agosto', type: 'MEDICAL_CERTIFICATE' })

    expect(updated.fileName).toBe('certificado-medico-alvarez-agosto')
    expect(updated.fileExtension).toBe(before.fileExtension)
    expect(updated.updatedAt).toBe('2026-09-19T12:00:00.000Z')
  })

  it('deletes a document and returns no content', async () => {
    const { service, store } = setup()
    const before = store.items.length

    await expect(service.remove('77000000-0000-4000-8000-000000000010')).resolves.toBeUndefined()
    expect(store.items).toHaveLength(before - 1)
    await expect(service.get('77000000-0000-4000-8000-000000000010')).rejects.toMatchObject({ code: 'DOCUMENT_NOT_FOUND', status: 404 })
  })

  it('issues a download URL that expires in 15 minutes', async () => {
    const { service } = setup()
    const download = await service.getDownload('77000000-0000-4000-8000-000000000001')

    expect(download.downloadUrl.length).toBeGreaterThan(0)
    expect(new Date(download.expiresAt).getTime() - NOW().getTime()).toBe(15 * 60 * 1000)
  })
})
