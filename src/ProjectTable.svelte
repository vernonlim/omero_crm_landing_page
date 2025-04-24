<script lang="ts">
    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let paginatedDatasets: { items: any[], length: number };
    export let currentPage: number;
    export let datasetsPerPage: number;

    export let changePage: (num: number) => void;
    export let onViewerOpen: (imageId: number, datasetId: number) => void;
    export let onSearchUpdate: (query: string) => void;

    $: hasNextPage = () => currentPage * datasetsPerPage < paginatedDatasets.length;
    $: hasPrevPage = () => currentPage > 1;

    function openViewer(imageId: number, datasetId: number) {
        onViewerOpen(imageId, datasetId); // Call the parent-provided callback
    }

    function handleSearchChange(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        onSearchUpdate(value); // Call the parent-provided callback
    }

    function clearSearch() {
        onSearchUpdate(""); // Clear the search query
    }
</script>

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
            <button class="clear-search" on:click|preventDefault={clearSearch}>
                &times;
            </button>
        {/if}
      </div>

        {#if paginatedDatasets.length === 0}
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
                {#each paginatedDatasets.items as image}
                    <tr>
                        <td>
                            <img
                                src={image.src}
                                alt="OMERO Image Thumbnail"
                                width="100"
                            />
                        </td>
                        <td>
                           <a href={`http://localhost:4080/webclient/?show=image-${image.id}`}>{image.imageName}</a>
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
