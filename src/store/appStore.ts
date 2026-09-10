import { create } from 'zustand';
import { VERSIONS } from '../data/versions';
import { Status } from '../data/schema';

export interface AppState {
  selectedVersion: string;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  searchQuery: string;
  filterStatus: Status | 'gaps' | null;
  returnFilterStatus: Status | 'gaps' | null;
  isStatsModalOpen: boolean;
  isSummaryBannerOpen: boolean;
  
  setSelectedVersion: (versionId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: Status | 'gaps' | null) => void;
  setReturnFilterStatus: (status: Status | 'gaps' | null) => void;
  setIsStatsModalOpen: (open: boolean) => void;
  setIsSummaryBannerOpen: (open: boolean) => void;
  toggleSummaryBanner: () => void;
  selectedPlatformFilter: string | null;
  setSelectedPlatformFilter: (filter: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedVersion: VERSIONS[0].id,
  selectedNodeId: null,
  selectedEdgeId: null,
  searchQuery: '',
  filterStatus: null,
  returnFilterStatus: null,
  isStatsModalOpen: false,
  isSummaryBannerOpen: false,
  selectedPlatformFilter: null,

  setSelectedVersion: (versionId: string) => set({ selectedVersion: versionId }),
  setSelectedNodeId: (nodeId: string | null) =>
    set((state) => ({
      selectedNodeId: nodeId,
      selectedEdgeId: nodeId ? null : state.selectedEdgeId,
      isStatsModalOpen: nodeId ? false : state.isStatsModalOpen,
      filterStatus: nodeId ? null : state.filterStatus,
    })),
  setSelectedEdgeId: (edgeId: string | null) =>
    set((state) => ({
      selectedEdgeId: edgeId,
      selectedNodeId: edgeId ? null : state.selectedNodeId,
      isStatsModalOpen: edgeId ? false : state.isStatsModalOpen,
      filterStatus: edgeId ? null : state.filterStatus,
    })),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterStatus: (status: Status | 'gaps' | null) => set({ filterStatus: status }),
  setReturnFilterStatus: (status: Status | 'gaps' | null) => set({ returnFilterStatus: status }),
  setIsStatsModalOpen: (open: boolean) => set({ isStatsModalOpen: open }),
  setIsSummaryBannerOpen: (open: boolean) => set({ isSummaryBannerOpen: open }),
  toggleSummaryBanner: () => set((state) => ({ isSummaryBannerOpen: !state.isSummaryBannerOpen })),
  setSelectedPlatformFilter: (filter: string | null) => set({ selectedPlatformFilter: filter }),
}));
