import { PipelineNode, VersionedContent } from './schema';

export function resolveContent(
  node: PipelineNode,
  versionId: string
): VersionedContent {
  return node.versions[versionId] ?? node.versions["current"]!;
}
