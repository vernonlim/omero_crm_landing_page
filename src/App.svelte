<script context="module">
  export type Route = "home" | "about" | "help" | "donate";
</script>

<script lang="ts">
  import "./app.css";
  import logo from "./assets/logo.png";
  import { onMount, onDestroy } from "svelte";
  import Home from "./Home.svelte";
  import Help from "./Guide.svelte";

  const routes: { name: Route; label: string }[] = [
    { name: "home", label: "Home" },
    { name: "about", label: "About" },
    { name: "help", label: "Help" },
    { name: "donate", label: "Donate" },
  ];

  let currentRoute: Route = "home";

  function isActive(route: Route) {
    return currentRoute === route;
  }

  function handleRouteChange(path: string) {
    const route = path.replace("/", "") as Route;
    const validRoute = routes.some((r) => r.name === route);
    currentRoute = validRoute ? route : "home";
  }

  // API endpoints
  let projectsUrl = "/api/v0/m/projects/";
  let datasetsUrl = "/api/v0/m/datasets/?project=";
  let imagesUrl = "/api/v0/m/images/?dataset=";
  let thumbnailUrl = "/webgateway/render_thumbnail/";
  let tagsUrl = "/v0/m/tags/?project=";

  // Reactive variables
  let datasetCount = 0;
  let projects = [];
  let projectImages = {};
  let searchQuery = "";
  let selectedImageId = null;

  let currentPage = 1; // Pagination state
  const datasetsPerPage = 5;

  let paginatedDatasets: { items: any[]; length: number } = {
    items: [],
    length: 0,
  };

  function updateDatasets() {
    paginatedDatasets = getPaginatedDatasets();
  }

  function getPaginatedDatasets(): { items: any[]; length: number } {
    const allImages = Object.values(projectImages).flat();

    const filtered = allImages.filter(
      (img) =>
        img.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.datasetName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const start = (currentPage - 1) * datasetsPerPage;
    const end = start + datasetsPerPage;

    return { items: filtered.slice(start, end), length: filtered.length };
  }

  function changePage(newPage: number) {
    currentPage = newPage; // Update the current page
    updateDatasets();
  }

  function navigate(route: Route) {
    currentRoute = route;
    window.scrollTo(0, 0);
  }

  onMount(() => {
    handleRouteChange(window.location.pathname);

    window.onpopstate = (event) => {
      handleRouteChange(event.state?.route);
    };

    fetchProjects();
  });

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
      console.log("Projects response:", data);

      projects = data.data || [];

      let tempProjectImages = {};
      await Promise.all(
        projects.map(async (project) => {
          let projectId = project["@id"];
          if (!projectId) return;

          try {
            console.log(`Fetching datasets for project ${projectId}...`);
            let datasetResponse = await fetch(`${datasetsUrl}${projectId}`);
            if (!datasetResponse.ok) {
              throw new Error(`HTTP error! status: ${datasetResponse.status}`);
            }
            let datasetData = await datasetResponse.json();
            console.log(`Datasets for project ${projectId}:`, datasetData);

            let datasets = datasetData.data || [];
            datasetCount = datasets.length;
            await Promise.all(
              datasets.map(async (dataset) => {
                let datasetId = dataset["@id"];
                let datasetName = dataset.Name;

                try {
                  console.log(`Fetching images for dataset ${datasetId}...`);
                  let imgResponse = await fetch(`${imagesUrl}${datasetId}`);
                  if (!imgResponse.ok) {
                    throw new Error(
                      `HTTP error! status: ${imgResponse.status}`
                    );
                  }
                  let imgData = await imgResponse.json();
                  console.log(`Images for dataset ${datasetId}:`, imgData);

                  if (!tempProjectImages[projectId])
                    tempProjectImages[projectId] = [];

                  let filteredImages = imgData.data.filter((img) => {
                    const imageName = img.Name || "Unnamed Image";
                    return (
                      !imageName.toLowerCase().includes("label") &&
                      !imageName.toLowerCase().includes("macro")
                    );
                  });

                  tempProjectImages[projectId].push(
                    ...filteredImages.map((img) => {
                      let thumbnailSrc = `${thumbnailUrl}${img["@id"]}/?size=128`;
                      console.log(`Thumbnail URL: ${thumbnailSrc}`);
                      return {
                        id: img["@id"],
                        src: thumbnailSrc,
                        datasetId: datasetId,
                        datasetName: datasetName,
                        imageName: img.Name || "Unnamed Image",
                        projectDescription: project.Description || "N/A",
                      };
                    })
                  );
                } catch (imgError) {
                  console.error(
                    `Error fetching images for dataset ${datasetId}:`,
                    imgError
                  );
                }
              })
            );
          } catch (datasetError) {
            console.error(
              `Error fetching datasets for project ${projectId}:`,
              datasetError
            );
          }
        })
      );

      projectImages = { ...tempProjectImages };
      console.log("Updated projectImages:", projectImages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    updateDatasets();
  }

  $: {
    if (searchQuery) {
      currentPage = 1;
    }
  }

  function getViewerUrl(imageId: number, datasetId: number) {
    return (
      window.location.origin +
      `/webclient/img_detail/${imageId}/?dataset=${datasetId}`
    );
  }

  onDestroy(() => {
    window.onpopstate = null;
  });
</script>

<nav>
  <div class="nav-container">
    <img src={logo} alt="Company Logo" class="logo" />
    <ul class="nav-links">
      {#each routes as route}
        <li class:active={isActive(route.name)}>
          <button type="button" on:click={() => navigate(route.name)}>
            <span>{route.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<div class="page-container">
  {#if currentRoute === "home"}
    <Home
      {datasetCount}
      {projects}
      {searchQuery}
      {paginatedDatasets}
      {currentPage}
      {datasetsPerPage}
      {getViewerUrl}
      {changePage}
      {navigate}
      onSearchUpdate={(search) => {
        searchQuery = search;
        updateDatasets();
      }}
    />
  {:else if currentRoute === "about"}
    <main></main>
  {:else if currentRoute === "help"}
    <Help/>
  {:else if currentRoute === "donate"}
    <main></main>
  {/if}
</div>

<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3>Get in Touch</h3>
      <p>Cancer Research Malaysia <span>200001007481 (510087-M)</span></p>
      <p>+603 5650 9797 (9am – 5pm)</p>
      <p>
        Level 1, Subang Jaya Medical Centre South Tower, No. 1, Jalan SS 12/1A,
        47500 Subang Jaya, Selangor Darul Ehsan.
      </p>
    </div>

    <div class="footer-section">
      <h3>Explore</h3>
      <ul>
        {#each routes as route}
          <li class:active={isActive(route.name)}>
            <button type="button" on:click={() => navigate(route.name)}>
              {route.label}
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <div class="footer-section">
      <h3>Follow Us</h3>
      <div class="social-icons">
        <a href="#"><i class="fab fa-twitter"></i></a>
        <a href="#"><i class="fab fa-facebook"></i></a>
        <a href="#"><i class="fab fa-instagram"></i></a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>
      &copy; {new Date().getFullYear()} Cancer Research Malaysia. All rights reserved.
    </p>
  </div>
</footer>
