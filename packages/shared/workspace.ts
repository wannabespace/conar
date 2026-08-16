import { type } from 'arktype'

const workspaceMetadataSchema = type({
  'default?': 'boolean',
}).narrow((value) => !Array.isArray(value))

const workspaceMetadataParser = type('string.json.parse').to(
  workspaceMetadataSchema
)

const parseWorkspaceMetadata = (
  metadata: string | null
): typeof workspaceMetadataSchema.infer => {
  if (!metadata) {
    return {}
  }

  const parsed = workspaceMetadataParser(metadata)

  return parsed instanceof type.errors ? {} : parsed
}

export const serializeWorkspaceMetadata = (
  metadata: typeof workspaceMetadataSchema.infer
) => JSON.stringify(metadata)

export const isDefaultWorkspaceMetadata = (metadata: string | null) =>
  parseWorkspaceMetadata(metadata).default === true
