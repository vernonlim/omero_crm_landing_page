<script lang="ts">
    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let getPaginatedDatasets: () => any[];
    export let currentPage: number;
    export let datasetsPerPage: number;
    export let projectImages: any;
    export let getViewerUrl: (imageId: number, datasetId: number) => string;

    export let changePage: (num: number) => void;
    export let onViewerOpen: (imageId: number, datasetId: number) => void;

    function openViewer(imageId: number, datasetId: number) {
        selectedImageId = imageId;
        selectedDatasetId = datasetId;

        // Call the callback to notify the parent
        onViewerOpen(imageId, datasetId);
    }

    let selectedImageId: number | null = null;
    let selectedDatasetId: number | null = null;
</script>

<section class="intro-section">
    <div class="intro-content">
        <h2>CRM: Breast Cancer Dataset</h2>
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
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search patients..."
            class="search-bar"
        />

        <table class="omero-table">
            <thead>
                <tr>
                    <th>Image Preview</th>
                    <th>Image Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each getPaginatedDatasets() as image}
                    <tr>
                        <td>
                            <img
                                src={image.src}
                                alt="OMERO Image Thumbnail"
                                width="100"
                            />
                        </td>
                        <td>
                            <a href="#" class="image-link">{image.imageName}</a>
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
            <button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
            </button>
            <span>Page {currentPage}</span>
            <button
                on:click={() => changePage(currentPage + 1)}
                disabled={currentPage * datasetsPerPage >= Object.values(projectImages).flat().length}
            >
                Next
            </button>
        </div>
    {:else}
        <p>Loading projects...</p>
    {/if}
</main>
