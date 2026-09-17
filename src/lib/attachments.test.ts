import { describe, expect, it } from 'vitest'
import { MAX_ATTACHMENT_BYTES, validateAttachmentBatch } from './attachments'

describe('attachment batch validation', () => {
  it('accepts a valid batch without copying it', () => {
    const files = [{ name: 'planilla.pdf', size: MAX_ATTACHMENT_BYTES }]
    const result = validateAttachmentBatch(files)

    expect(result).toEqual({ acceptedFiles: files, issues: [], valid: true })
  })

  it('rejects the complete batch and lists every oversized file', () => {
    const files = [
      { name: 'uno.pdf', size: MAX_ATTACHMENT_BYTES + 1 },
      { name: 'dos.pdf', size: MAX_ATTACHMENT_BYTES + 2 },
    ]
    const result = validateAttachmentBatch(files)

    expect(result.valid).toBe(false)
    expect(result.acceptedFiles).toEqual([])
    expect(result.issues).toHaveLength(2)
    expect(result.issues.map((issue) => issue.fileName)).toEqual(['uno.pdf', 'dos.pdf'])
  })

  it('rejects more than ten files atomically', () => {
    const files = Array.from({ length: 11 }, (_, index) => ({ name: `${index}.pdf`, size: 1 }))
    const result = validateAttachmentBatch(files)

    expect(result).toMatchObject({ acceptedFiles: [], valid: false })
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'TOO_MANY_FILES' }))
  })
})
