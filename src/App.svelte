<script lang="ts">
  import Projects from './Projects.svelte';
  import DatasetInfo from './DatasetInfo.svelte';
  import logo from './assets/logo.png';
  import { onMount, onDestroy } from 'svelte';

  type Route = 'home' | 'projects' | 'dataset';
  let currentRoute: Route = 'home';
  let selectedDatasetId: number | null = null;

  function isActive(route: Route) {
    return currentRoute === route;
  }

  const routes = {
    home: null,
    projects: Projects,
    dataset: DatasetInfo,
    about: null,
    contact: null
  };

  // API endpoints
  let projectsUrl = "/api/api/v0/m/projects/";
  let datasetsUrl = "/api/api/v0/m/datasets/?project=";
  let imagesUrl = "/api/api/v0/m/images/?dataset=";
  let thumbnailUrl = "/api/webgateway/render_thumbnail/";
  let tagsUrl = "/api/api/v0/m/tags/?project=";

  // Reactive variables
  let projectCount = 0;
  let projects = [];
  let projectImages = {};
  let searchQuery = "";
  let selectedImageId = null;

   onMount(() => {
   const hash = window.location.hash.replace('#', '').split('/');

  if (hash[0] && routes[hash[0]]) {
    currentRoute = hash[0] as Route;
    if (hash[0] === 'dataset' && hash[1]) {
      selectedImageId = parseInt(hash[1]);
    }
  }

  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '').split('/');
    currentRoute = (newHash[0] && routes[newHash[0]]) ? newHash[0] as Route : 'home';
    if (newHash[0] === 'dataset' && newHash[1]) {
      selectedImageId = parseInt(newHash[1]);
    }
  });
});

  function navigate(route: Route, id: number = null) {
  currentRoute = route;
  if (route === 'dataset') {
    selectedImageId = id;
  }
  window.location.hash = id ? `${route}/${id}` : route;
  window.scrollTo(0, 0);
}
  // Slideshow images
  let slides = [
    "https://www.cancerresearch.my/wp-content/uploads/2017/09/6.jpg",
    "https://images.unsplash.com/photo-1592838948611-69071139f9e9?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://www.yayasanpetronas.com.my/wp-content/uploads/2019/09/Continuing-the-pioneering-work-on-prevalent-cancers-in-Malaysia-2.jpg"
  ];

  let slideTexts = [
    { title: "Discover Groundbreaking Research", desc: "Explore the latest in cancer research through OMERO's interactive platform." },
    { title: "Unlock the Power of Data", desc: "Visualize and analyze biological images with OMERO tools." },
    { title: "Collaborate and Innovate", desc: "Work with researchers worldwide to advance medical discoveries." }
  ];
  let currentSlideIndex = 0;
  let slideshowInterval;

  onMount(() => {
    fetchProjects();

    slideshowInterval = setInterval(() => {
      nextSlide();
    }, 5000);
  });

  onDestroy(() => {
    clearInterval(slideshowInterval);
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

    projectCount = data.meta.totalCount || 0;
    projects = data.data || [];

    let tempProjectImages = {};
    await Promise.all(projects.map(async (project) => {
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
        await Promise.all(datasets.map(async (dataset) => {
          let datasetId = dataset["@id"];
          let datasetName = dataset.Name;

          try {
            console.log(`Fetching images for dataset ${datasetId}...`);
            let imgResponse = await fetch(`${imagesUrl}${datasetId}`);
            if (!imgResponse.ok) {
              throw new Error(`HTTP error! status: ${imgResponse.status}`);
            }
            let imgData = await imgResponse.json();
            console.log(`Images for dataset ${datasetId}:`, imgData);

            if (!tempProjectImages[projectId]) tempProjectImages[projectId] = [];

            let filteredImages = imgData.data.filter(img => {
              const imageName = img.Name || "Unnamed Image";
              return !imageName.toLowerCase().includes("label") && !imageName.toLowerCase().includes("macro");
            });

            tempProjectImages[projectId].push(
              ...filteredImages.map(img => {
                let thumbnailSrc = `${thumbnailUrl}${img["@id"]}/?size=128`;
                console.log(`Thumbnail URL: ${thumbnailSrc}`);
                return {
                  id: img["@id"],
                  src: thumbnailSrc,
                  datasetId: datasetId,
                  datasetName: datasetName,
                  imageName: img.Name || "Unnamed Image",
                  projectDescription: project.Description || "N/A"
                };
              })
            );
          } catch (imgError) {
            console.error(`Error fetching images for dataset ${datasetId}:`, imgError);
          }
        }));
      } catch (datasetError) {
        console.error(`Error fetching datasets for project ${projectId}:`, datasetError);
      }
    }));

    projectImages = { ...tempProjectImages };
    console.log("Updated projectImages:", projectImages);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
  // Slideshow
  function nextSlide() {
    const slideTextElement = document.querySelector(".slide-text") as HTMLElement;
    if (slideTextElement) slideTextElement.style.opacity = "0";

    setTimeout(() => {
      currentSlideIndex = (currentSlideIndex + 1) % slides.length;
      if (slideTextElement) slideTextElement.style.opacity = "1";
    }, 200);
  }

  function prevSlide() {
    const slideTextElement = document.querySelector(".slide-text") as HTMLElement;
    if (slideTextElement) slideTextElement.style.opacity = "0";

    setTimeout(() => {
      currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
      if (slideTextElement) slideTextElement.style.opacity = "1";
    }, 200);
  }

 // Pagination variables
  let currentPage = 1;
  const datasetsPerPage = 5;

  function getFilteredDatasets() {
    const allDatasets = Object.values(projectImages).flat();
    return allDatasets.filter(image =>
      image.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.datasetName.toLowerCase().includes(searchQuery.toLowerCase())
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
      'omeroViewer',
      'height=600,width=850,left=50,top=50,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no'
    );
    if (owindow && !owindow.closed) owindow.focus();
    return false;
  }

  function getViewerUrl(imageId: number, datasetId: number) {
    return `http://localhost:4080/webclient/img_detail/${imageId}/?dataset=${datasetId}`;
  }
</script>

// Navigation Bar
<nav>
  <div class="nav-container">
    <img src={logo} alt="Company Logo" class="logo" />
    <ul class="nav-links">
      <li class:active={isActive('home')}>
        <a href="#" on:click|preventDefault={() => navigate('home')}><span>Home</span></a>
      </li>
      <li class:active={isActive('projects')}>
        <a href="#projects" on:click|preventDefault={() => navigate('projects')}><span>Projects</span></a>
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

{#if currentRoute === 'home'}
<section class="slideshow-container">
  <button class="prev" on:click={prevSlide}>&#10094;</button>
  <div class="slide-card">
    <img src={slides[currentSlideIndex]} alt="Slideshow Image" class="slide-image" />
    {#key currentSlideIndex}
    <div class="slide-text">
      <h2>{slideTexts[currentSlideIndex].title}</h2>
      <p>{slideTexts[currentSlideIndex].desc}</p>
    </div>
    {/key}
  </div>
  <button class="next" on:click={nextSlide}>&#10095;</button>
</section>

<section class="intro-section">
  <div class="intro-content">
    <h2>About Cancer Research Malaysia</h2>
    <p>
     Established in 2001, Cancer Research Malaysia is the only non-profit organisation in the country dedicated to the 
     research of cancers that commonly affect Malaysians as well as the people around our region.
     Our scientists, in collaboration with local and international researchers, have achieved consistent progress over 
     the years in understanding and preventing such cancers.
    </p>
  </div>
</section>

<main>
<h2>HOW WE'RE REVERSING CANCER</h2>
<div class="creative-gallery">
  <div class="frame focal-frame">
    <img src="https://images.unsplash.com/photo-1631049129023-3b03d6d9b8bd?q=80&w=2600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Science concept" />
    <div class="frame-caption">
      <h3>Treating Cancers</h3>
      <p>There have been major advances in cancer treatment thanks to our understanding of what genetic changes cause cancers to happen.</p>
    </div>
    <div class="corner-decoration"></div>
  </div>

  <div class="frame-cluster">
    <div class="frame small-frame">
      <img src="https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Lab equipment" />
      <div class="frame-caption">
        <h3>Focus on Asian-centric Cancers</h3>
        <p>The majority of research focuses on cancers more common among Caucasians, much of what we know may not directly apply to Asians.</p>
      </div>
    </div>

    <div class="frame small-frame">
      <img src="https://images.unsplash.com/photo-1631563018856-81be9c118283?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Microscope" />
      <div class="frame-caption">
        <h3>Making Care Accessible</h3>
        <p>It's unsustainable to develop new cures when most people struggle getting access to existing ones.</p>
      </div>
    </div>
  </div>
</div>

  <h1>PROJECTS</h1>
  <p>Total Projects: {projectCount}</p>

  {#if projects.length > 0}
  <input type="text" bind:value={searchQuery} placeholder="Search datasets..." class="search-bar" />

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
  {#each getPaginatedDatasets() as image}
    <tr>
      <td><img src={image.src} alt="OMERO Image" width="100" /></td>
      <td>
 	     <a href="#" on:click|preventDefault={() => {
            navigate('dataset', image.id);
    	    }}
    	    class="image-link">
   	      {image.imageName}
       </a>
	    </td>
      <td>{image.datasetName}</td>
      <td>{image.projectDescription}</td>
       <td class="viewer-actions">
        <button on:click|preventDefault={() => {
          document.getElementById('omero-viewer-container').style.display = 'block';
          document.getElementById('omero-viewer-iframe').src = getViewerUrl(image.id, image.datasetId);
          selectedImageId = image.id;
          selectedDatasetId = image.datasetId;
          }}
          class="viewer-btn">
          Quick View
        </button>
       </td>
    </tr>
  {/each}
 </tbody>
</table>

<div id="omero-viewer-container" style="display: none; margin-top: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h3>OMERO iviewer</h3>
    <button 
      on:click|preventDefault={() => document.getElementById('omero-viewer-container').style.display = 'none'}
      class="viewer-btn">
      Close Viewer
    </button>
    <button on:click|preventDefault={() => openViewerPopup(selectedImageId, selectedDatasetId)}
       class="viewer-btn">
       View in iviewer
    </button>
  </div>
  <iframe 
    id="omero-viewer-iframe" 
    width="100%" 
    height="600" 
    style="border: 1px solid #ccc; border-radius: 8px;"
    allowfullscreen>
  </iframe>
</div>

  <div class="pagination-controls">
      <button on:click={() => currentPage--} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage}</span>
      <button on:click={() => currentPage++}
        disabled={currentPage * datasetsPerPage >= Object.values(projectImages).flat().length}>
        Next
      </button>
  </div>
{:else}
  <p>Loading projects...</p>
{/if}
  <section class="cards-container">
    <div class="card">
     <div class="card-icon">
      <i class="fas fa-database"></i>
     </div>
      <h2>Explore Data</h2>
      <p>Dive into OMERO datasets with interactive tools.</p>
    </div>
    <div class="card">
     <div class="card-icon">
      <i class="fas fa-chart-bar"></i>
    </div>
      <h2>Analysis Tools</h2>
      <p>Analytics to process biological images.</p>
    </div>
    <div class="card">
      <div class="card-icon">
      <i class="fas fa-users"></i>
      </div>
      <h2>Collaborate</h2>
      <p>Share and discuss insights with your research team.</p>
    </div>
  </section>

  <section class="outro-section">
    <div class="outro-columns">
      <div class="outro-column left-column">
        <h1>Every gift matters in the fight against cancer</h1>
      </div>
    
      <div class="vertical-divider"></div>
    
      <div class="outro-column right-column">
        <h2>
          Support the essential work of our researchers, so that we can provide access to world-class, compassionate care for people with cancer.
        </h2>

        <button class="donate-btn" on:click={() => window.location.href = '/donate'}>
          Donate Now
        </button>
      </div>
    </div>
  </section>
</main>

{:else if currentRoute === 'projects'}
  <Projects 
    projectsUrl={projectsUrl}
    datasetsUrl={datasetsUrl}
    imagesUrl={imagesUrl}
    thumbnailUrl={thumbnailUrl}
    projectCount={projectCount}
  />
{:else if currentRoute === 'dataset' && selectedImageId}
  <DatasetInfo selectedImageId={selectedImageId} />
{/if}

<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3>Get in Touch</h3>
      <p>Cancer Research Malaysia 200001007481 (510087-M)</p>
      <p>+603 5650 9797 (9am – 5pm)</p>
      <p>Level 1, Subang Jaya Medical Centre South Tower, No. 1, Jalan SS 12/1A, 47500 Subang Jaya, Selangor Darul Ehsan.</p> 
    </div>
    
    <div class="footer-section">
      <h3>Explore</h3>
      <ul>
        <li class:active={isActive('home')}>
	        <a href="#" on:click|preventDefault={() => navigate('home')}>Home</a></li>
        <li class:active={isActive('projects')}>
	        <a href="#projects" on:click|preventDefault={() => navigate('projects')}>Projects</a></li>
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
    <p>&copy; {new Date().getFullYear()} Cancer Research Malaysia. All rights reserved.</p>
  </div>
</footer>

<style>
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

  /* Reset default margins and padding */
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    background-color: white;
  }

  /* Navigation Bar */
  nav {
    background-color: white;
    padding: 10px 20px;
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 100;
  }

  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }

  .nav-links {
    list-style: none;
    display: flex;
    gap: 20px;
  }

  .nav-links li {
    display: inline;
  }

  .nav-links li a {
    color: black;
    text-decoration: none;
    font-size: 16px;
    font-weight: bold;
    position: relative;
    padding: 5px 0;
    display: inline-block;
  }

  .nav-links li a span {
    position: relative;
  }

  .nav-links li a span::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -5px;
    left: 0;
    background-color: #00b4d8;
    transition: width 0.3s ease;
  }

  .nav-links li a:hover span::after {
    width: 100%;
  }

  /* Active navigation item */
    .nav-links li.active a {
    color: #00b4d8;
  }

  .nav-links li.active a span::after {
    width: 100% !important;
    background-color: #00b4d8;
  }

  /* Keep the hover effect */
    .nav-links li:not(.active) a:hover span::after {
    width: 100%;
  }

  /* Remove default underline */
    .nav-links li a:hover {
    text-decoration: none;
  }

  .logo {
    width: 150px;
    height: auto;
    border: none;
    outline: none;
  }

  main {
    margin-top: 80px;
    padding: 0;
    width: 100%;
    max-width: 100%;
  }

  /* Slideshow */
  .slideshow-container {
    position: relative;
    width: 100vw;
    max-width: 100%;
    height: 680px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
  }

  .intro-section {
    padding: 40px 20px;
    margin-top: -30px;
    background-color: #eeeeee;
    text-align: center;
  }
  
  .intro-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .intro-section h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 2rem;
  }
  
  .intro-section p {
    color: #495057;
    line-height: 1.6;
    margin-bottom: 15px;
    font-size: 1.1rem;
  }

  .slide-card {
    width: 100%;
    height: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slide-image {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .prev, .next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    color: white;
    border: none;
    padding: 15px;
    cursor: pointer;
    font-size: 24px;
  }

  .prev {
    left: 0px;
  }

  .next {
    right: 0px;
  }

  .prev:hover, .next:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .slide-text {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
    width: 80%;
    max-width: 600px;
    background: transparent;
    padding: 20px;
    border-radius: 10px;
    opacity: 0;
    animation: fadeInUp 1.5s ease-out forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 30px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

 .creative-gallery {
    display: flex;
    gap: 30px;
    padding: 20px;
    margin: 50px 0;
    background: white;
    position: relative;
  }

  .focal-frame {
    width: 55%;
    height: 500px;
  }

  .frame-cluster {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 50%;
    height: 500px;
  } 

  .small-frame {
    flex: 1;
    height: calc((100% - 50px) / 3);
  }

  @media (max-width: 1200px) {
    .creative-gallery {
      flex-direction: column;
    }
    
    .focal-frame,
    .frame-cluster {
      width: 100%;
      height: auto;
    }
    
    .small-frame {
      height: 150px;
    }
  }

  .frame {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: all 0.4s ease;
    background: white;
  }

  .frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.5s ease;
  }

  .frame:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }

  .frame:hover img {
    transform: scale(1.05);
  }

  .frame-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: white;
    Font-weight: bold;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .frame:hover .frame-caption {
    transform: translateY(0);
  }

  .frame-caption h3 {
    margin-bottom: 5px;
    font-size: 1.8rem;
  }

  .frame-caption p {
    font-size: 1.1rem;
    opacity: 0;
    transition: opacity 0.3s ease 0.1s;
  }

  .frame:hover .frame-caption p {
    opacity: 1;
  }

  .corner-decoration {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    border-top: 3px solid #00b4d8;
    border-right: 3px solid #00b4d8;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .frame:hover .corner-decoration {
    opacity: 1;
  }

  .small-frame .frame-caption {
    padding: 10px;
    transform: translateY(100%);
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
  }

  .small-frame .frame-caption h3 {
    font-size: 1.5rem;
    margin-bottom: 5px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .small-frame .frame-caption p {
    font-size: 1rem;
    line-height: 1.3;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  /* OMERO Projects table */
  .omero-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .omero-table thead {
    background-color: #00b4d8;
    color: white;
    text-align: center;
    font-weight: bold;
  }

  .omero-table th, .omero-table td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
  }

  .omero-table img {
    border-radius: 5px;
    transition: transform 0.2s ease-in-out;
  }

  .omero-table img:hover {
    transform: scale(1.05);
  }

  .omero-table tbody tr:hover {
    background-color: #f1f1f1;
    cursor: pointer;
  }

  .dataset-link {
    color: #2c3e50;
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;
  }

  .dataset-link:hover {
    text-decoration: underline;
    color: #2980b9;
  }

  /* Display Cards */
  .cards-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 40px;
    padding: 20px;
  }

  /* Individual Card */
  .card {
    background: white;
    padding: 30px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    width: 30%;
    text-align: center;
    cursor: pointer;
  }

  .card:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    .cards-container {
      flex-direction: column;
      align-items: center;
    }
    .card {
      width: 80%;
    }
  }

  .card-icon {
    font-size: 2.5rem;
    color: #00b4d8;
    margin-bottom: 15px;
    transition: all 0.3s ease;
  }

  .search-bar {
    width: 100%;
    max-width: 400px;
    padding: 10px;
    margin: 10px auto;
    display: block;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    background-color: white;
    color: black;
    transition: all 0.3s ease-in-out;
  }

  .search-bar:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }

 .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }

  .pagination-controls button {
    padding: 5px 10px;
    background-color: #00b4d8;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .pagination-controls button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .viewer-btn {
    background-color: #00b4d8;
    color: white;
    font-weight: bold;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .viewer-btn:hover {
    background-color: #2980b9;
  }

  .outro-section {
    padding: 10px 20px;
    background-color: #f8f9fa;
    margin-bottom: -50px;
    margin-top: 30px;
  }
  
  .outro-columns {
    display: flex;
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
    text-align: left;
  }
  
  .outro-column {
    flex: 1;
    padding: 0 40px;
  }
  
  .vertical-divider {
    position: absolute;
    left: 50%;
    top: 10%;
    bottom: 10%;
    width: 2px;
    background-color: #d1d5db;
    transform: translateX(-50%);
  }
  
  .outro-section h1 {
    color: #2c3e50;
    text-align: left;
    margin-bottom: 50px;
    font-size: 60px;
  }
  
  .outro-section h2 {
    color: #495057;
    font-size: 20px;
    text-align: left;
    padding-top: 50px;
  }

  @media (max-width: 768px) {
    .outro-columns {
      flex-direction: column;
    }
    
    .vertical-divider {
      display: none;
    }
    
    .outro-column {
      padding: 0px;
    }
    
    .outro-column:first-child {
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 0px;
    }
    
    .outro-column:last-child {
      padding-top: 40px;
    }
  }

  .donate-btn {
    background-color: #00b4d8;
    color: white;
    border: none;
    padding: 12px 30px;
    margin-top: 25px;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    align-self: flex-start;
  }

  .donate-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

   .donate-btn:active {
    transform: translateY(0);
  }

  .site-footer {
    background-color: #2c3e50;
    color: white;
    margin-top: 50px;
    width: 100%;
  }

  .footer-container {
    display: flex;
    text-align: left;
    justify-content: space-around;
    max-width: none;
    margin: 0 auto;
    padding: 0;
    flex-wrap: wrap;
  }

 .footer-section {
    flex: 1;
    min-width: 250px;
    margin-bottom: 30px;
    padding: 0 70px;
  }

  .footer-section h3 {
    color: white;
    margin-bottom: 20px;
    font-size: 18px;
    position: relative;
    padding-bottom: 10px;
  }

  .footer-section h3:after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 300px;
    height: 2px;
    background: #3498db;
  }

.footer-section p, 
  .footer-section a {
    color: #ecf0f1;
    margin-bottom: 10px;
    display: block;
    text-decoration: none;
    transition: color 0.3s;
  }

  .footer-section a:hover {
    color: #3498db;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
  }

  .footer-section ul li {
    margin-bottom: 10px;
  }

  .social-icons {
    display: flex;
    gap: 15px;
  }

  .social-icons a {
    color: white;
    font-size: 30px;
    transition: color 0.3s;
    display: inline-block;
  }

  .social-icons a:hover {
    color: #3498db;
    transform: translateY(-3px);
  }

  .footer-bottom {
    background-color: #1a252f;
    padding: 15px 0;
    text-align: center;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .footer-container {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .footer-section {
      margin-bottom: 30px;
    }

    .footer-section h3:after {
      left: 50%;
      transform: translateX(-50%);
    }

    .social-icons {
      justify-content: center;
    }
  }

</style>