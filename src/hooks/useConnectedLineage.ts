import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { PIPELINE_EDGES } from '../data/edges';
import { getConnectedLineage, ConnectedLineage } from '../data/lineageUtils';

export function useConnectedLineage(): ConnectedLineage | null {
  const selectedEdgeId = useAppStore((state) => state.selectedEdgeId);
  const selectedVersion = useAppStore((state) => state.selectedVersion);

  return useMemo(() => {
    if (!selectedEdgeId) return null;
    const visibleEdges = PIPELINE_EDGES.filter(
      (e) => !e.visibleIn || e.visibleIn.includes(selectedVersion)
    );
    return getConnectedLineage(selectedEdgeId, visibleEdges);
  }, [selectedEdgeId, selectedVersion]);
}
