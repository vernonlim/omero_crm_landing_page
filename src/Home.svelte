<script lang="ts">
    import ProjectTable from "./ProjectTable.svelte";

    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let getPaginatedDatasets: () => any[];
    export let currentPage: number;
    export let datasetsPerPage: number;
    export let projectImages: any;
    export let getViewerUrl: (imageId: number, datasetId: number) => string;

    export let changePage: (num: number) => void;

    let viewerState = {
        isOpen: false,
        imageId: null as number | null,
        datasetId: null as number | null,
        viewerUrl: null as string | null,
    };

    function openViewer(imageId: number, datasetId: number) {
        viewerState = {
            isOpen: true,
            imageId,
            datasetId,
            viewerUrl: getViewerUrl(imageId, datasetId),
        };
    }

    function closeViewer() {
        viewerState = {
            isOpen: false,
            imageId: null,
            datasetId: null,
            viewerUrl: null,
        };
    }
</script>

<ProjectTable
    {datasetCount}
    {projects}
    {searchQuery}
    {getPaginatedDatasets}
    {currentPage}
    {datasetsPerPage}
    {projectImages}
    {getViewerUrl}
    {changePage}
    onViewerOpen={openViewer}
/>

<!-- Viewer Modal -->
{#if viewerState.isOpen}
  <div id="omero-viewer-container" style="margin-top: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3>OMERO iviewer</h3>
      <button on:click={closeViewer} class="viewer-btn">Close Viewer</button>
      <a href={viewerState.imageId !== null && viewerState.datasetId !== null ? getViewerUrl(viewerState.imageId, viewerState.datasetId) : undefined}>
        <button
          class="viewer-btn"
        >
          View in iviewer
        </button>
      </a>
    </div>
    <iframe
      id="omero-viewer-iframe"
      src={viewerState.viewerUrl}
      width="100%"
      height="600"
      style="border: 1px solid #ccc; border-radius: 8px;"
      allowfullscreen
    ></iframe>
  </div>
{/if}

<section class="outro-section">
    <div class="outro-columns">
        <div class="outro-column left-column">
            <h1>Every gift matters in the fight against cancer</h1>
        </div>

        <div class="vertical-divider"></div>

        <div class="outro-column right-column">
            <h2>
                Support the essential work of our researchers, so that we
                can provide access to world-class, compassionate care for
                people with cancer.
            </h2>

            <button
                class="donate-btn"
                on:click={() => (window.location.href = "/donate")}
            >
                Donate Now
            </button>
        </div>
    </div>
</section>