export interface SearchEngine {
  inputQuery: string[]
  bodyQuery: string[]
  sidebarContainerQuery: string[]
  appendContainerQuery: string[]
  watchRouteChange?: (callback: () => void) => void
}

export const config: Record<string, SearchEngine> = {
  google: {
    inputQuery: ["input[name='q']"],
    // TODO: consider removing this
    bodyQuery: ['#place-'],
    sidebarContainerQuery: ['#rhs'],
    appendContainerQuery: ['#rcnt'],
  },
  // TODO: replace this with github and/or commonwealth
  arxiv: {
    inputQuery: ["input[name='query']"],
    bodyQuery: ['#abs'],
    sidebarContainerQuery: ['div[class="metatable"]'],
    appendContainerQuery: [],
  },
  github: {
    inputQuery: ["input[name='query']"],
    bodyQuery: ['#files'],
    sidebarContainerQuery: [
      'div.file-header.d-flex.flex-md-row.flex-column.flex-md-items-center.file-header--expandable.js-file-header.js-skip-tagsearch.sticky-file-header.js-position-sticky.js-position-sticky-stacked[data-path="proto/osmosis/concentrated-liquidity/tx.proto"]',
    ], // js-diff-progressive-container'],
    appendContainerQuery: [],
  },
}
