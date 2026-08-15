import { type } from 'arktype'

export const workspaceMetadataSchema = type({
  'default?': 'boolean',
}).narrow((value) => !Array.isArray(value))

export type WorkspaceMetadata = typeof workspaceMetadataSchema.infer

const workspaceMetadataParser = type('string.json.parse').to(
  workspaceMetadataSchema
)

export const parseWorkspaceMetadata = (
  metadata?: string | null
): WorkspaceMetadata => {
  if (!metadata) {
    return {}
  }

  const parsed = workspaceMetadataParser(metadata)

  return parsed instanceof type.errors ? {} : parsed
}

export const serializeWorkspaceMetadata = (metadata: WorkspaceMetadata) =>
  JSON.stringify(metadata)

export const isDefaultWorkspaceMetadata = (metadata?: string | null) =>
  parseWorkspaceMetadata(metadata).default === true
