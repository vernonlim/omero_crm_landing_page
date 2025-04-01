<script lang="ts">
  import { onMount } from 'svelte';

  // API endpoints
  const projectsUrl = "/api/api/v0/m/projects/";
  const datasetsUrl = "/api/api/v0/m/datasets/?project=";
  const imagesUrl = "/api/api/v0/m/images/?dataset=";
  const thumbnailUrl = "/api/webgateway/render_thumbnail/";

  let projects = [];
  let allImages = [];
  let filteredImages = [];
  let currentPage = 1;
  const itemsPerPage = 20;
  let isLoading = true;

  // Fetch projects, datasets, and images
  async function fetchProjects() {
    try {
      isLoading = true;
      const response = await fetch(projectsUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      projects = data.data || [];

      let tempAllImages = [];
      await Promise.all(projects.map(async (project) => {
        const projectId = project["@id"];
        if (!projectId) return;

        try {
          const datasetResponse = await fetch(`${datasetsUrl}${projectId}`);
          if (!datasetResponse.ok) throw new Error(`HTTP error! status: ${datasetResponse.status}`);
          const datasetData = await datasetResponse.json();

          await Promise.all(datasetData.data.map(async (dataset) => {
            try {
              const imgResponse = await fetch(`${imagesUrl}${dataset["@id"]}`);
              if (!imgResponse.ok) throw new Error(`HTTP error! status: ${imgResponse.status}`);
              const imgData = await imgResponse.json();

              tempAllImages.push(
                ...imgData.data.map(img => ({
                  id: img["@id"],
                  src: `${thumbnailUrl}${img["@id"]}/?size=256`,
                  datasetId: dataset["@id"],
                  imageName: img.Name || "Unnamed Image",
                  isSpecial: img.Name === "SD0014 CD3 CT.svs [0]"
                }))
              );
            } catch (imgError) {
              console.error(`Error fetching images for dataset ${dataset["@id"]}:`, imgError);
            }
          }));
        } catch (datasetError) {
          console.error(`Error fetching datasets for project ${projectId}:`, datasetError);
        }
      }));

      allImages = tempAllImages;

      filteredImages = allImages.filter(img => img.isSpecial);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchProjects();
  });
</script>

<main>
  {#if isLoading}
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="content-container">
  <article class="main-content">
        <h1>SD0014 CD3 CT</h1>

	   <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Species</th>
                <th>Subjects</th>
                <th>Data Types</th>
                <th>Cancer Type</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brain</td>
                <td>Human</td>
                <td>178</td>
                <td>MR, Segmentation, Diagnosis, Demographic</td>
                <td>Cancer</td>
                <td>Public, Complete</td>
                <td>2025/03/25</td>
              </tr>
            </tbody>
	        </table>
    </div>
    <section class="text-section">
          <h2>Abstract</h2>
          <p>While there is a growing number of publicly available cancer imaging and genomic datasets, there remains a need for more comprehensive, multimodal datasets to enhance research and clinical decision-making. Here, we present a novel dataset designed to support the study of cancer progression, treatment response, and biomarker discovery. This dataset includes imaging data, histopathological findings, and molecular profiles from a diverse cohort of patients diagnosed with various cancer types. Advanced imaging techniques, including MRI, CT, and PET scans, are complemented by genomic and clinical metadata, such as mutation status, treatment regimens, and patient outcomes. By making this dataset publicly available, we aim to provide researchers with valuable resources to develop improved diagnostic tools, refine treatment strategies, and ultimately enhance patient care in oncology.</p>
          
          <h2>Techniques</h2>
          <p>The most common technique involves preparing tissue samples through fixation, processing, sectioning, and staining (typically with hematoxylin and eosin, or H&E). Digital pathology has emerged as an important field, enabling whole slide imaging and computer-assisted analysis.</p>
          
	        <h3>Image Acquisition</h3>
          <p>Imaging protocol included pre- and postcontrast 3D volumetric T1-weighted magnetization-prepared rapid acquisition gradient-echo (MPRAGE) sequences (TE/TR = 2.6/7.0 ms, TI = 900 ms, flip angle = 9°, FOV = 25 cm, matrix = 1.0 × 1.0 × 1.2 mm) and a 3D T2-weighted fluid-attenuated inversion recovery (FLAIR) sequence (TE/TR = 130/6200 ms, TI = 2000 ms, FOV = 25 cm, matrix = 1.0 × 1.0 × 1.2 mm).</p>
          
          <h3>Benefit to Researchers</h3>
          <p>The dataset will significantly expand the limited availability of publicly accessible, high-quality cancer imaging datasets. It is the first dataset to incorporate multi-shell diffusion MRI for differentiating tumor cellularity from extracellular fluid and necrotic regions, enhancing the precision of tumor microstructure assessment. Additionally,it is the first to include detailed tumor subregion annotations—capturing both enhancing and non-enhancing tumor components</p>
    </section>

	  <section class="citation-section">
          <h2>Citation</h2>
          <div class="citation-box">
            <p>Author(s). (2025). <em>SD0014 CD3 CT Histopathology Dataset</em>. Cancer Research Malaysia</p>
          </div>
  
          <div class="citation-box">
            <p>Image ID: SD0014 CD3 CT.svs [0], Retrieved from Cancer Research Malaysia</p>
          </div>
    </section>
  </article>
    
	  <div class="image-container">
        {#each filteredImages as image}
          <div class="right-aligned-image">
            <div class="image-card">
              <a href={`http://localhost:4080/webclient/img_detail/${image.id}/?dataset=${image.datasetId}`} 
                target="_blank">
                <img 
                  src={image.src} 
                  alt={image.imageName} 
                  loading="lazy"
                  on:error={(e) => e.target.src = 'placeholder-image.jpg'} 
                />
                <div class="image-name">{image.imageName}</div>
              </a>
            </div>
	        <div class="image-caption">
            <p><strong>Microscopic image of tissue sample</strong></p>
            <p>This image shows a stained tissue section prepared for histopathological examination. The specific staining pattern helps pathologists identify cellular abnormalities.</p>
          </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 60px;
    position: relative;
  }

  .data-table {
    margin: 2rem 0;
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  tr:hover {
    background-color: #f5f5f5;
  }

  @media (max-width: 768px) {
    table {
      display: block;
    }
    
    th, td {
      padding: 8px 10px;
    }
  }

  .content-container {
    display: flex;
    gap: 30px;
  }

  .main-content {
    flex: 1.3;
    min-width: 950px;
    line-height: 1.6;
  }

  .text-section {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.2rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.6rem;
    margin: 1.8rem 0 1rem 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.3rem;
  }

  h3 {
    font-size: 1.3rem;
    margin: 1.5rem 0 0.8rem 0;
  }

  p {
    margin-bottom: 1rem;
    text-align: justify;
  }

  ul {
    margin: 0.8rem 0;
    padding-left: 2rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  .image-container {
    width: 300px;
    position: sticky;
    top: 100px;
    align-self: flex-start;
  }

  .right-aligned-image {
    width: 100%;
  }

  .image-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin-bottom: 1rem;
  }

  .image-card:hover {
    transform: translateY(-10px);
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.2); 
  }

.image-card img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    display: block;
    background: #f5f5f5;
  }

  .image-name {
    padding: 10px;
    font-size: 0.9rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .image-caption {
    font-size: 0.9rem;
    line-height: 1.5;
    background: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    border-left: 3px solid #3498db;
  }

  .loading-spinner {
    text-align: center;
    padding: 50px 0;
  }

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .content-container {
      flex-direction: column;
    }
    
    .image-container {
      width: 100%;
      position: static;
      order: -1;
      margin-bottom: 2rem;
    }
    
    .image-card img {
      height: 160px;
    }
  }

  .citation-section {
    margin: 3rem 0;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
  
  .citation-box {
    background-color: #f8f9fa;
    border-left: 4px solid #3498db;
    padding: 15px;
    margin: 15px 0;
    font-family: monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    border-radius: 0 4px 4px 0;
  }
  
  .citation-box p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .citation-box {
      font-size: 0.85rem;
      padding: 10px;
    }
  }
</style>