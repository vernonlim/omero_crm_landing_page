<script lang="ts">
    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let getPaginatedDatasets: () => any[];
    export let currentPage: number;
    export let datasetsPerPage: number;
    export let projectImages: any;
    export let navigate: (route: string, id?: number) => void;
    export let getViewerUrl: (imageId: number, datasetId: number) => string;
    export let openViewerPopup: (imageId: number, datasetId: number) => void;

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
                                on:click|preventDefault={() => {
                                    document.getElementById(
                                        "omero-viewer-container",
                                    ).style.display = "block";
                                    document.getElementById(
                                        "omero-viewer-iframe",
                                    ).src = getViewerUrl(
                                        image.id,
                                        image.datasetId,
                                    );
                                    selectedImageId = image.id;
                                    selectedDatasetId = image.datasetId;
                                }}
                                class="viewer-btn"
                            >
                                Quick View
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <div
            id="omero-viewer-container"
            style="display: none; margin-top: 20px;"
        >
            <div
                style="display: flex; justify-content: space-between; align-items: center;"
            >
                <h3>OMERO iviewer</h3>
                <button
                    on:click|preventDefault={() =>
                        (document.getElementById(
                            "omero-viewer-container",
                        ).style.display = "none")}
                    class="viewer-btn"
                >
                    Close Viewer
                </button>
                <button
                    on:click|preventDefault={() =>
                        openViewerPopup(selectedImageId, selectedDatasetId)}
                    class="viewer-btn"
                >
                    View in iviewer
                </button>
            </div>
            <iframe
                id="omero-viewer-iframe"
                width="100%"
                height="600"
                style="border: 1px solid #ccc; border-radius: 8px;"
                allowfullscreen
            >
            </iframe>
        </div>

        <div class="pagination-controls">
            <button on:click={() => currentPage--} disabled={currentPage === 1}>
                Previous
            </button>
            <span>Page {currentPage}</span>
            <button
                on:click={() => currentPage++}
                disabled={currentPage * datasetsPerPage >=
                    Object.values(projectImages).flat().length}
            >
                Next
            </button>
        </div>
    {:else}
        <p>Loading projects...</p>
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
</main>
