<script lang="ts">
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let getPaginatedDatasets: () => { items: any[]; total: number };
    export let currentPage: number;
    export let datasetsPerPage: number;
    export let projectImages: any;
    export let getViewerUrl: (imageId: number, datasetId: number) => string;

    export let changePage: (num: number) => void;
    export let onViewerOpen: (imageId: number, datasetId: number) => void;

    $: hasNextPage = () => currentPage * datasetsPerPage < getPaginatedDatasets().total;
    $: hasPrevPage = () => currentPage > 1;

    function openViewer(imageId: number, datasetId: number) {
        selectedImageId = imageId;
        selectedDatasetId = datasetId;

        // Call the callback to notify the parent
        onViewerOpen(imageId, datasetId);
    }

    function handleSearchChange(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        dispatch("updateSearch", value);
    }

    let selectedImageId: number | null = null;
    let selectedDatasetId: number | null = null;

</script>

<section class="intro-section">
    <div class="intro-content">
        <h2>Cancer Research Malaysia</h2>
        <h2>Breast Cancer Dataset</h2>
        <p>
            This is a portal to access our Breast Cancer Dataset, with
            Whole-Slide Images of 5 different markers (CD3, CD4, CD8, H&E and
            PDL1) from ~600 patients.
        </p>
        <p>
            Click the "Help" button at the top right for instructions on how to
            use this portal. Otherwise, click on one of the images below to be
            sent to it in the main user interface.
        </p>
    </div>
</section>

<main class="patient-data">
    <h3>Total Patients: {datasetCount}</h3>

    {#if projects.length > 0}
      <div class="search-container">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search patients..."
            class="search-bar"
            on:input={handleSearchChange}
        />

        {#if searchQuery}
            <button class="clear-search" on:click|preventDefault={() => dispatch("updateSearch", "")}>
                &times;
            </button>
        {/if}
      </div>

        {#if getPaginatedDatasets().items.length === 0}
          <div class="search-results-msg">
            <p>No images found matching "{searchQuery}"</p>
          </div>
        {:else}
        <table class="omero-table">
            <thead>
                <tr>
                    <th>Image Preview</th>
                    <th>Image Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each getPaginatedDatasets().items as image}
                    <tr>
                        <td>
                            <img
                                src={image.src}
                                alt="OMERO Image Thumbnail"
                                width="100"
                            />
                        </td>
                        <td>
                           {image.imageName}
                        </td>
                        <td class="viewer-actions">
                            <button
                                on:click|preventDefault={() => openViewer(image.id, image.datasetId)}
                                class="viewer-btn"
                            >
                                Quick View
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <button on:click={() => changePage(currentPage - 1)} disabled={!hasPrevPage()}>
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button on:click={() => changePage(currentPage + 1)} disabled={!hasNextPage()}>
            Next
          </button>
        </div>
      {/if}
    {:else}
        <p>Loading projects...</p>
    {/if}
</main>
