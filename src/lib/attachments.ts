export const MAX_ATTACHMENT_FILES = 10
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

export interface AttachmentCandidate {
  name: string
  size: number
}

export interface AttachmentIssue {
  code: 'FILE_TOO_LARGE' | 'TOO_MANY_FILES'
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
  }

  return {
    acceptedFiles: issues.length === 0 ? files : [],
    issues,
    valid: issues.length === 0,
  }
}
