<script lang="ts">
    import { onMount } from 'svelte';
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
    
    let viewerContainer: HTMLElement;
    let topAnchor: HTMLElement; 

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
      
       setTimeout(() => {
            if (viewerContainer) {
                viewerContainer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 50); // Small delay to allow DOM update
    
    }

    function closeViewer() {
        viewerState = {
            isOpen: false,
            imageId: null,
            datasetId: null,
            viewerUrl: null,
        };

    setTimeout(() => {
        if (topAnchor) {
            topAnchor.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 50);
  }

</script>

<div bind:this={topAnchor}></div>

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
    on:updateSearch
/>

<!-- Viewer Modal -->
{#if viewerState.isOpen}
  <div id="omero-viewer-container" style="margin-top: 0px; padding-top: 50px; scroll-margin-top: 50px;" bind:this={viewerContainer}>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 2rem;">
      <h3>OMERO iviewer</h3>
      <button on:click={closeViewer} class="viewer-btn">Close Viewer</button>
      <a href={`http://localhost:4080/webclient/?show=image-${viewerState.imageId}`} 
         target="_blank" 
         rel="noopener noreferrer">
        <button
          class="viewer-btn"
        >
          Open in OMERO
        </button>
      </a>
    </div>
    <iframe
      id="omero-viewer-iframe"
      src={viewerState.viewerUrl}
      width="100%"
      height="650"
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