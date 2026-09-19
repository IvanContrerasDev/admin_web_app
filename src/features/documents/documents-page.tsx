import { useState } from 'react'
import { Form, useSearchParams } from 'react-router-dom'
import { formatArgentinaDateTime } from '../../lib/dates'
import { DOCUMENT_TYPE_LABELS, documentTypeSchema, type DocumentType } from '../../types/documents'
import { PaginationNav, QueryState, fieldClass, labelClass } from '../organization/organization-ui'
import { DocumentDetailDialog } from './document-detail-dialog'
import { DocumentUploadDialog } from './document-upload-dialog'
import { useDocumentList, useDocumentOptions } from './use-documents'
import { formatFileSize } from '../timesheets/use-timesheets'

const pageSize = 25

function validType(value: string | null): DocumentType | undefined {
  const result = documentTypeSchema.safeParse(value)
  return result.success ? result.data : undefined
}

function validDateValue(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''
}

export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const options = useDocumentOptions()
  const [notice, setNotice] = useState('')

  const search = searchParams.get('search') ?? ''
  const employeeId = searchParams.get('employeeId') ?? ''
  const type = validType(searchParams.get('type'))
  const uploadedBy = searchParams.get('uploadedBy') ?? ''
  const uploadedFrom = validDateValue(searchParams.get('uploadedFrom'))
  const uploadedTo = validDateValue(searchParams.get('uploadedTo'))
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)

  const documentsQuery = useDocumentList({
    search: search || undefined,
    employeeId: employeeId || undefined,
    type,
    uploadedBy: uploadedBy || undefined,
    uploadedFrom: uploadedFrom || undefined,
    uploadedTo: uploadedTo || undefined,
    page,
    pageSize,
  })

  const updateFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const openDetail = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('documentId', id)
    setSearchParams(next)
  }

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('documentId')
    setSearchParams(next, { replace: true })
  }

  const openUpload = () => {
    const next = new URLSearchParams(searchParams)
    next.set('upload', 'true')
    setSearchParams(next)
  }

  const closeUpload = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('upload')
    setSearchParams(next, { replace: true })
  }

  const documents = documentsQuery.data?.data ?? []
  const pagination = documentsQuery.data?.pagination
  const selectedDocument = documents.find((item) => item.id === searchParams.get('documentId'))

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">Legajos</h1>
          <p className="mt-2 text-pretty leading-relaxed text-foreground/65">Documentación digital de cada empleado: certificados, contratos y formularios.</p>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={openUpload}>Cargar documento</button>
      </header>

      <div className="rounded-lg border border-foreground/15 bg-background p-4 sm:p-5">
        <Form className="flex flex-col gap-4 lg:flex-row lg:items-end" method="get">
          <label className={`${labelClass} min-w-0 flex-1`} htmlFor="document-search">
            Buscar
            <input className={`${fieldClass} font-normal placeholder:text-foreground/45`} defaultValue={search} id="document-search" name="search" placeholder="Archivo, empleado o legajo…" type="search" autoComplete="off" />
          </label>
          <label className={labelClass} htmlFor="document-type">
            Tipo de documento
            <select className={`${fieldClass} font-normal`} id="document-type" name="type" value={type ?? ''} onChange={(event) => updateFilter('type', event.target.value)}>
              <option value="">Todos</option>
              {documentTypeSchema.options.map((option) => <option key={option} value={option}>{DOCUMENT_TYPE_LABELS[option]}</option>)}
            </select>
          </label>
          <label className={labelClass} htmlFor="document-employee">
            Empleado
            <select className={`${fieldClass} font-normal`} id="document-employee" name="employeeId" value={employeeId} onChange={(event) => updateFilter('employeeId', event.target.value)}>
              <option value="">Todos</option>
              {(options.employees.data?.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.lastName}, {employee.firstName} · {employee.employeeId}</option>)}
            </select>
          </label>
          <button className="min-h-11 rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="submit">Buscar</button>
        </Form>
        <div className="mt-4 grid gap-4 border-t border-foreground/10 pt-4 sm:grid-cols-3">
          <label className={labelClass} htmlFor="document-uploaded-by">
            Cargado por
            <input className={`${fieldClass} font-normal placeholder:text-foreground/45`} id="document-uploaded-by" name="uploadedBy" placeholder="Nombre del usuario…" type="search" autoComplete="off" value={uploadedBy} onChange={(event) => updateFilter('uploadedBy', event.target.value)} />
          </label>
          <label className={labelClass} htmlFor="document-uploaded-from">
            Cargado desde
            <input className={`${fieldClass} font-normal`} id="document-uploaded-from" name="uploadedFrom" type="date" value={uploadedFrom} onChange={(event) => updateFilter('uploadedFrom', event.target.value)} />
          </label>
          <label className={labelClass} htmlFor="document-uploaded-to">
            Cargado hasta
            <input className={`${fieldClass} font-normal`} id="document-uploaded-to" name="uploadedTo" type="date" value={uploadedTo} onChange={(event) => updateFilter('uploadedTo', event.target.value)} />
          </label>
        </div>
      </div>

      {notice ? <p className="rounded-lg border border-secondary/40 bg-secondary/10 px-5 py-4 text-sm font-semibold text-secondary" role="status">{notice}</p> : null}

      <QueryState pending={documentsQuery.isPending} error={documentsQuery.isError} empty={!documentsQuery.isPending && !documentsQuery.isError && documents.length === 0} subject="los documentos" onRetry={() => void documentsQuery.refetch()}>
        <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <caption className="sr-only">Documentos de legajo ordenados del más reciente al más antiguo</caption>
            <thead>
              <tr className="border-b border-foreground/15 text-sm">
                <th className="px-4 py-3 font-semibold" scope="col">Archivo</th>
                <th className="px-4 py-3 font-semibold" scope="col">Tipo</th>
                <th className="px-4 py-3 font-semibold" scope="col">Empleado</th>
                <th className="px-4 py-3 font-semibold" scope="col">Cargado</th>
                <th className="px-4 py-3 font-semibold" scope="col">Actualizado</th>
                <th className="px-4 py-3 font-semibold" scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr className="border-b border-foreground/10 last:border-b-0" key={document.id}>
                  <td className="max-w-64 px-4 py-3">
                    <p className="truncate font-semibold" title={document.fileName}>{document.fileName}</p>
                    <p className="uppercase text-foreground/60">{document.fileExtension} · {formatFileSize(document.fileSizeBytes)}</p>
                  </td>
                  <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[document.type]}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{document.employee.lastName}, {document.employee.firstName}</p>
                    <p className="text-foreground/60">{document.employee.employeeId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="tabular-nums">{formatArgentinaDateTime(document.createdAt, { dateStyle: 'short' })}</p>
                    <p className="text-foreground/60">por {document.uploadedBy.firstName} {document.uploadedBy.lastName}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatArgentinaDateTime(document.updatedAt, { dateStyle: 'short' })}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => openDetail(document.id)}>Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>

      <PaginationNav pagination={pagination} label="documentos" onPage={goToPage} />

      {searchParams.get('upload') === 'true' ? (
        <DocumentUploadDialog
          employees={options.employees.data?.data ?? []}
          workplaces={options.workplaces.data?.data ?? []}
          onClose={closeUpload}
          onSaved={(createdCount) => {
            closeUpload()
            setNotice(createdCount === 1 ? 'Se cargó 1 documento al legajo.' : `Se cargaron ${createdCount} documentos al legajo.`)
          }}
        />
      ) : null}
      {selectedDocument ? (
        <DocumentDetailDialog
          key={selectedDocument.id}
          document={selectedDocument}
          onClose={closeDetail}
          onDeleted={() => {
            closeDetail()
            setNotice('El documento se eliminó del legajo.')
          }}
        />
      ) : null}
    </section>
  )
}
