export const MAX_ATTACHMENT_FILES = 10
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'] as const

export type AllowedAttachmentExtension = (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]

export function attachmentExtension(fileName: string): string {
  const segments = fileName.trim().toLowerCase().split('.')
  return segments.length > 1 ? (segments.at(-1) ?? '') : ''
}

export interface AttachmentCandidate {
  name: string
  size: number
}

export interface AttachmentIssue {
  code: 'FILE_TOO_LARGE' | 'TOO_MANY_FILES' | 'FILE_EXTENSION_NOT_ALLOWED'
  message: string
  fileName?: string
}

export interface AttachmentValidationResult<T extends AttachmentCandidate> {
  acceptedFiles: readonly T[]
  issues: readonly AttachmentIssue[]
  valid: boolean
}

export function validateAttachmentBatch<T extends AttachmentCandidate>(
  files: readonly T[],
): AttachmentValidationResult<T> {
  const issues: AttachmentIssue[] = []

  if (files.length > MAX_ATTACHMENT_FILES) {
    issues.push({
      code: 'TOO_MANY_FILES',
      message: `Podés adjuntar hasta ${MAX_ATTACHMENT_FILES} archivos por operación.`,
    })
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      issues.push({
        code: 'FILE_TOO_LARGE',
        fileName: file.name,
        message: `${file.name} supera el límite de 20 MiB.`,
      })
    }
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(attachmentExtension(file.name) as AllowedAttachmentExtension)) {
      issues.push({
        code: 'FILE_EXTENSION_NOT_ALLOWED',
        fileName: file.name,
        message: `${file.name} tiene un formato no permitido. Formatos aceptados: PDF, JPG, JPEG, PNG, DOC, DOCX y TXT.`,
      })
    }
  }

  return {
    acceptedFiles: issues.length === 0 ? files : [],
    issues,
    valid: issues.length === 0,
  }
}
