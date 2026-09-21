import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { formatArgentinaDateTime } from '../../lib/dates'
import { userService } from '../../services/services'
import { DOCUMENT_TYPE_LABELS } from '../../types/documents'
import { PaginationNav, QueryState } from '../organization/organization-ui'
import { formatFileSize } from '../timesheets/use-timesheets'
import { DocumentDetailDialog } from './document-detail-dialog'
import { useDocumentList } from './use-documents'

const pageSize = 25

export function EmployeeDocumentsPage() {
  const { userId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState('')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: ({ signal }) => userService.get(userId, signal),
    enabled: Boolean(userId),
  })

  const documentsQuery = useDocumentList({ employeeId: userId || undefined, page, pageSize })

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

  if (userQuery.isPending) return <p aria-live="polite">Cargando legajo…</p>
  if (userQuery.isError || !userQuery.data) {
    return (
      <section className="rounded-lg border border-destructive/35 bg-background p-6" role="alert">
        <h1 className="text-2xl font-bold">No pudimos abrir este legajo</h1>
        <p className="mt-2 text-foreground/65">Verificá el enlace o volvé al listado de empleados.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center rounded-md border border-foreground/25 px-4 font-semibold" to="/usuarios">Volver a empleados</Link>
      </section>
    )
  }

  const user = userQuery.data
  const documents = documentsQuery.data?.data ?? []
  const pagination = documentsQuery.data?.pagination
  const selectedDocument = documents.find((item) => item.id === searchParams.get('documentId'))

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Migas de pan">
        <Link className="font-semibold text-primary hover:underline" to="/usuarios">Empleados</Link>
        <span className="px-2 text-foreground/40" aria-hidden="true">/</span>
        <Link className="font-semibold text-primary hover:underline" to={`/usuarios/${user.id}`}>{user.firstName} {user.lastName}</Link>
        <span className="px-2 text-foreground/40" aria-hidden="true">/</span>
        <span aria-current="page">Legajo</span>
      </nav>

      <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-semibold text-primary tabular-nums">Legajo {user.employeeId}</p>
          <h1 className="mt-1 text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">Legajo de {user.firstName} {user.lastName}</h1>
          <p className="mt-2 text-pretty leading-relaxed text-foreground/65">Documentos digitales de este empleado: certificados, contratos y formularios.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}`}>Ver detalle</Link>
      </header>

      {notice ? <p className="rounded-lg border border-secondary/40 bg-secondary/10 px-5 py-4 text-sm font-semibold text-secondary" role="status">{notice}</p> : null}

      <QueryState pending={documentsQuery.isPending} error={documentsQuery.isError} empty={!documentsQuery.isPending && !documentsQuery.isError && documents.length === 0} subject="los documentos del legajo" onRetry={() => void documentsQuery.refetch()}>
        <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">Documentos del legajo de {user.firstName} {user.lastName}</caption>
            <thead>
              <tr className="border-b border-foreground/15 text-sm">
                <th className="px-4 py-3 font-semibold" scope="col">Archivo</th>
                <th className="px-4 py-3 font-semibold" scope="col">Tipo</th>
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
