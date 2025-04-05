<script lang="ts">
  import "./app.css";
  import Home from "./Home.svelte";
  import logo from "./assets/logo.png";
  import { onMount, onDestroy } from "svelte";

  type Route = "home" | "projects" | "dataset";
  let currentRoute: Route = "home";
  let selectedDatasetId: number | null = null;

  function isActive(route: Route) {
    return currentRoute === route;
  }

  const routes = {
    home: null,
    about: null,
    contact: null,
  };

  // API endpoints
  let projectsUrl = "/api/v0/m/projects/";
  let datasetsUrl = "/api/v0/m/datasets/?project=";
  let imagesUrl = "/api/v0/m/images/?dataset=";
  let thumbnailUrl = "/webgateway/render_thumbnail/";
  let tagsUrl = "/api/v0/m/tags/?project=";

  // Reactive variables
  let datasetCount = 0;
  let projects = [];
  let projectImages = {};
  let searchQuery = "";
  let selectedImageId = null;

  onMount(() => {
    const hash = window.location.hash.replace("#", "").split("/");

    if (hash[0] && routes[hash[0]]) {
      currentRoute = hash[0] as Route;
      if (hash[0] === "dataset" && hash[1]) {
        selectedImageId = parseInt(hash[1]);
      }
    }

    window.addEventListener("hashchange", () => {
      const newHash = window.location.hash.replace("#", "").split("/");
      currentRoute =
        newHash[0] && routes[newHash[0]] ? (newHash[0] as Route) : "home";
      if (newHash[0] === "dataset" && newHash[1]) {
        selectedImageId = parseInt(newHash[1]);
      }
    });
  });

  function navigate(route: Route, id: number = 0) {
    currentRoute = route;
    window.location.hash = id ? `${route}/${id}` : route;
    window.scrollTo(0, 0);
  }

  onMount(() => {
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
                      `HTTP error! status: ${imgResponse.status}`,
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
                    }),
                  );
                } catch (imgError) {
                  console.error(
                    `Error fetching images for dataset ${datasetId}:`,
                    imgError,
                  );
                }
              }),
            );
          } catch (datasetError) {
            console.error(
              `Error fetching datasets for project ${projectId}:`,
              datasetError,
            );
          }
        }),
      );

      projectImages = { ...tempProjectImages };
      console.log("Updated projectImages:", projectImages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Pagination variables
  let currentPage = 1;
  const datasetsPerPage = 5;

  function getFilteredDatasets() {
    const allDatasets = Object.values(projectImages).flat();
    return allDatasets.filter(
      (image) =>
        image.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.datasetName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  function getPaginatedDatasets() {
    const filteredDatasets = getFilteredDatasets();
    const startIndex = (currentPage - 1) * datasetsPerPage;
    const endIndex = startIndex + datasetsPerPage;
    return filteredDatasets.slice(startIndex, endIndex);
  }

  $: {
    if (searchQuery) {
      currentPage = 1;
    }
  }

  function openViewerPopup(imageId: number, datasetId: number) {
    const url = `http://localhost:4080/webclient/img_detail/${imageId}/?dataset=${datasetId}`;
    const owindow = window.open(
      url,
      "omeroViewer",
      "height=600,width=850,left=50,top=50,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no",
    );
    if (owindow && !owindow.closed) owindow.focus();
    return false;
  }

  function getViewerUrl(imageId: number, datasetId: number) {
    return `http://localhost:4080/webclient/img_detail/${imageId}/?dataset=${datasetId}`;
  }
</script>

<nav>
  <div class="nav-container">
    <img src={logo} alt="Company Logo" class="logo" />
    <ul class="nav-links">
      <li class:active={isActive("home")}>
        <a href="#" on:click|preventDefault={() => navigate("home")}
          ><span>Home</span></a
        >
      </li>
      <li>
        <a href="/about"><span>About Us</span></a>
      </li>
      <li>
        <a href="/contact"><span>Help</span></a>
      </li>
    </ul>
  </div>
</nav>

{#if currentRoute === "home"}
  <Home
    {datasetCount}
    {projects}
    {searchQuery}
    {getPaginatedDatasets}
    {currentPage}
    {datasetsPerPage}
    {projectImages}
    {navigate}
    {getViewerUrl}
    {openViewerPopup}
  />
{/if}

<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3>Get in Touch</h3>
      <p>Cancer Research Malaysia 200001007481 (510087-M)</p>
      <p>+603 5650 9797 (9am – 5pm)</p>
      <p>
        Level 1, Subang Jaya Medical Centre South Tower, No. 1, Jalan SS 12/1A,
        47500 Subang Jaya, Selangor Darul Ehsan.
      </p>
    </div>

    <div class="footer-section">
      <h3>Explore</h3>
      <ul>
        <li class:active={isActive("home")}>
          <a href="#" on:click|preventDefault={() => navigate("home")}>Home</a>
        </li>
        <li class:active={isActive("projects")}>
          <a
            href="#projects"
            on:click|preventDefault={() => navigate("projects")}>Projects</a
          >
        </li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
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

