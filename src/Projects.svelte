<script lang="ts">
  import { onMount } from 'svelte';
  import DatasetInfo from './DatasetInfo.svelte';

  type Route = 'home' | 'projects' | 'dataset';
  let currentRoute: Route = 'projects';
  let selectedDatasetId: number | null = null;

  // API endpoints
  const projectsUrl = "/api/api/v0/m/projects/";
  const datasetsUrl = "/api/api/v0/m/datasets/?project=";
  const imagesUrl = "/api/api/v0/m/images/?dataset=";
  const thumbnailUrl = "/api/webgateway/render_thumbnail/";

  let projectCount = 0;
  let projects = [];
  let projectImages = {};
  let searchQuery = "";
  let selectedImageId = null;
  let currentPage = 1;
  const itemsPerPage = 2;
  let viewMode: 'grid' | 'list' = 'grid';

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (hash && pages.hasOwnProperty(hash)) {
      currentPage = hash as Page;
    } else {
      currentPage = 'home';
    }
  }

  function navigateTo(page: Page) {
    currentPage = page;
    window.location.hash = page === 'home' ? '' : page;
  }

  function navigate(route: Route, id: number = null) {
    currentRoute = route;
    if (route === 'dataset') {
      selectedImageId = id;
    }
    window.location.hash = id ? `${route}/${id}` : route;
    window.scrollTo(0, 0);
  }

  // Fetch projects, datasets, and images
 async function fetchProjects() {
  try {
    console.log("Fetching projects...");
    let response = await fetch(projectsUrl);
    let responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = JSON.parse(responseText);
    projectCount = data.meta.totalCount || 0;
    projects = data.data || [];

    let tempProjectImages = {};
    await Promise.all(projects.map(async (project) => {
      let projectId = project["@id"];
      if (!projectId) return;

      try {
        let datasetResponse = await fetch(`${datasetsUrl}${projectId}`);
        if (!datasetResponse.ok) throw new Error(`HTTP error! status: ${datasetResponse.status}`);
        let datasetData = await datasetResponse.json();

        let datasets = datasetData.data || [];
        await Promise.all(datasets.map(async (dataset) => {
          let datasetId = dataset["@id"];
          let datasetName = dataset.Name;

          try {
            let imgResponse = await fetch(`${imagesUrl}${datasetId}`);
            if (!imgResponse.ok) throw new Error(`HTTP error! status: ${imgResponse.status}`);
            let imgData = await imgResponse.json();

	    let filteredImages = imgData.data.filter(img => {
     const imageName = img.Name || "Unnamed Image";
     return !imageName.toLowerCase().includes("label") && !imageName.toLowerCase().includes("macro");
});


  if (!tempProjectImages[datasetId]) {
    tempProjectImages[datasetId] = {
      datasetName: datasetName,
      projectName: project.Name || "Unnamed Project",
      images: []
    };
  }
  
  tempProjectImages[datasetId].images.push(
    ...filteredImages.map(img => ({
      id: img["@id"],
      src: `${thumbnailUrl}${img["@id"]}/?size=256`,
      imageName: img.Name || "Unnamed Image",
      projectDescription: project.Description || "N/A"
    }))
   );
      } catch (imgError) {
        console.error(`Error fetching images for dataset ${datasetId}:`, imgError);
      }
    }));
      } catch (datasetError) {
        console.error(`Error fetching datasets for project ${projectId}:`, datasetError);
      }
    }));

     $: projectImages = projectImages;
     projectImages = { ...tempProjectImages };

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function getFilteredImages() {
   if (!searchQuery.trim()) {
    return Object.values(projectImages).flatMap(dataset => 
      dataset.images.map(image => ({
        ...image,
        datasetId: Object.keys(projectImages).find(id => projectImages[id] === dataset),
        datasetName: dataset.datasetName,
        }))
      );
    }

    const terms = searchQuery.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

    return Object.values(projectImages).flatMap(dataset => 
    dataset.images.map(image => ({
     ...image,
      datasetId: Object.keys(projectImages).find(id => projectImages[id] === dataset),
      datasetName: dataset.datasetName,
    }))
   ).filter(image => {
    const searchText = `${image.imageName} ${image.datasetName} ${image.projectDescription}`.toLowerCase();
    
    return terms.every(term => {
      const cleanTerm = term.replace(/^"|"$/g, '').toLowerCase();

      if (cleanTerm.startsWith('*') && cleanTerm.endsWith('*')) {
	 return searchText.includes(cleanTerm.slice(1, -1));

      } else if (cleanTerm.startsWith('*')) {
        return searchText.endsWith(cleanTerm.slice(1));

      } else if (cleanTerm.endsWith('*')) {
        return searchText.startsWith(cleanTerm.slice(0, -1));

      } else {
        return new RegExp(`\\b${cleanTerm}\\b`, 'i').test(searchText);
      }
    });
  });
}

  function getPaginatedImages() {
    const filteredImages = getFilteredImages();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredImages.slice(startIndex, endIndex);
  }

  $: if (searchQuery) currentPage = 1;
  $: viewMode;

  $: searchResultMessage = searchQuery
  ? `${getFilteredImages().length} result${getFilteredImages().length !== 1 ? 's' : ''} found for "${searchQuery}"`
  : "";

  onMount(() => {
    fetchProjects();
  });
</script>

<main>
  <div class="gallery-header">
    <h1 class="bg-heading">Project Collection</h1>
    <div class="description">
      <p>Data are organized as “collections”; typically these are patient cohorts related by a common disease (e.g. lung cancer), image modality or type (MRI, CT, digital histopathology, etc) or research focus. Supporting data related to the images such as patient outcomes, treatment details, genomics and image analyses are also provided when available.</p>
    </div>
    <span>Total Projects: {projectCount}</span>
    
    <div class="controls">
      <div class="search-container">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search images, datasets or projects..." 
          class="search-bar" 
        />
        {#if searchQuery}
          <button class="clear-search" on:click={() => searchQuery = ''}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        {/if}
      </div>

      <div class="view-toggle">
        <button class:active={viewMode === 'grid'} on:click={() => viewMode = 'grid'}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button class:active={viewMode === 'list'} on:click={() => viewMode = 'list'}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <rect x="3" y="4" width="18" height="2" rx="1" />
            <rect x="3" y="11" width="18" height="2" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  </div>

   {#if projects.length > 0}
    {#if searchQuery && getFilteredImages().length === 0}
      <div class="no-results">
        <p>No images found matching "{searchQuery}"</p>
        <button on:click={() => searchQuery = ''}>Clear search</button>
      </div>
    {:else}
     {#if viewMode === 'grid'}
      {#each Object.entries(projectImages) as [datasetId, dataset]}
     {#if getPaginatedImages().some(img => img.datasetId === datasetId)}
      <div class="dataset-group">
        <h3 class="dataset-header">Project: {dataset.projectName}</h3>
        <div class="image-grid">
          {#each getPaginatedImages().filter(img => img.datasetId === datasetId) as image}
            <div class="image-card">
              <a href={`http://localhost:4080/webclient/img_detail/${image.id}/?dataset=${datasetId}`} target="_blank">
                <img src={image.src} alt={image.imageName} loading="lazy" />
              </a>
              <div class="image-info">
                <div class="image-name">{image.imageName}</div>
                <div class="dataset-name">{image.datasetName}</div>
                <div class="project-name">{image.projectName}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
{:else}
        <table class="omero-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Image Name</th>
	            <th>Dataset Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each getPaginatedImages() as image}
              <tr>
                <td><img src={image.src} alt="OMERO Image" width="100" /></td>
                <td>{image.imageName}</td>
                <td>{image.datasetName}</td>
                <td>{image.projectDescription}</td>
                <td>
                  <a href="#" on:click|preventDefault={() => {navigate('dataset', image.id);}}
    	            class="image-link">
   	              More Info
  		            </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      {#if viewMode === 'list' && getFilteredImages().length > 0}
        <div class="pagination-controls">
          <button on:click={() => currentPage--} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(getFilteredImages().length / itemsPerPage)}</span>
          <button
            on:click={() => currentPage++}
            disabled={currentPage * itemsPerPage >= getFilteredImages().length}>
            Next
          </button>
        </div>
      {/if}
    {/if}
  {:else}
    <p class="loading-message">Loading images...</p>
  {/if}
</main>

<style>

  main {
    max-width: 1500px;
    margin: 0;
    padding: 20px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .bg-heading {
    background: linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15)),url('https://images.unsplash.com/photo-1597594438450-abafcdfcb446?q=80&w=2662&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
    background-size: cover;
    background-position: center;
    color: white;
    font-weight: 500;
    text-align: center;
    padding: 2rem 1rem;
    padding-top: 200px;
    padding-bottom: 50px;
    margin-top: 0;
    margin: -20px -20px 20px -20px;
    position: relative;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  }

  .bg-heading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
  }

  .bg-heading > * {
    position: relative;
    z-index: 1;
  }

  .gallery-header {
    margin-bottom: 20px;
  }

  .description p {
    font-weight: 500;
    text-align: justify;
    margin-bottom: 15px;
    line-height: 1.5;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 80%;
    max-width: 800px;
    margin: 0 auto 20px auto;
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-bar {
    width: 600px;
    min-width: 400px;
    flex-shrink: 0;
    padding: 10px 15px;
    padding-right: 35px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    flex: 0 0 auto;
    background-color: white;
    color: black;
    transition: all 0.3s ease-in-out;
  }

  .search-bar:focus {
    outline: none; 
    border-color: #007bff; 
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }

   .view-toggle {
    flex: 0 0 auto;
    display: flex;
    gap: 5px;
  }

  .view-toggle button {
    background: #b0bec5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-toggle button.active {
    background-color: #1e88e5;
    color: white;
    border-color: #1e88e5;
  }

  .view-toggle button svg {
    fill: currentColor;
  }

  .clear-search {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    transition: color 0.2s;
  }

  .clear-search:hover {
    color: #333;
  }

  .clear-search svg {
    pointer-events: none;
  }

  .dataset-header {
    text-align: center;
    margin: 0 0 15px 0;
    font-size: 1.2em;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    Margin-left: 50px;
    width: 100%;
  }

  .image-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .image-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  .image-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-bottom: 1px solid #eee;
  }

  .image-info {
    padding: 12px;
    font-size: 0.9em;
  }

  .image-name {
    font-weight: bold;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dataset-name, .project-name {
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .omero-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    font-size: 16px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .omero-table th, .omero-table td {
    padding: 12px 15px;
    text-align: center;
    border-bottom: 1px solid #ddd;
  }

  .omero-table th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  .omero-table tr:hover {
    background-color: #f9f9f9;
  }

  .omero-table img {
    width: 150px;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
  }

  .dataset-group {
    width: 100%;
    margin-bottom: 30px;
    border-bottom: 1px solid #eee;
    padding-bottom: 20px;
  }

  .dataset-group h3 {
    margin: 0 0 15px 0;
    font-size: 1.2em;
    color: #333;
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 30px;
  }

  .pagination-controls button {
    padding: 8px 16px;
    background-color: #1e88e5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .pagination-controls button:hover:not(:disabled) {
    background-color: #1565c0;
  }

  .pagination-controls button:disabled {
    background-color: #b0bec5;
    cursor: not-allowed;
  }

  .pagination-controls span {
    font-size: 0.9em;
    color: #666;
  }

  .loading-message {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .no-results {
    text-align: center;
    padding: 40px;
    border-radius: 8px;
    margin: 20px 0;
  }

  .no-results p {
    font-size: 1.2em;
    color: #666;
    margin-bottom: 15px;
  }

  .no-results button {
    padding: 8px 16px;
    background-color: #1e88e5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .no-results button:hover {
    background-color: #1565c0;
  }
</style>