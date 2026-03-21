let sliders = [];
let currentSlide = 0;
let sliderInterval;

// Load sliders
async function loadSliders() {
  try {
    const response = await fetch('/api/sliders');
    sliders = await response.json();
    
    if (sliders.length === 0) {
      document.getElementById('mainSlider').innerHTML = `
        <div class="slider-empty">
          <h2>Welcome to MangaHay</h2>
          <p>Start exploring our amazing manga collection!</p>
        </div>
      `;
      return;
    }
    
    displaySliders();
    startAutoSlide();
  } catch (error) {
    console.error('Error loading sliders:', error);
    document.getElementById('mainSlider').innerHTML = `
      <div class="slider-empty">
        <h2>Welcome to MangaHay</h2>
        <p>Your destination for the best manga reading experience</p>
      </div>
    `;
  }
}

// Display sliders
function displaySliders() {
  const container = document.getElementById('mainSlider');
  
  container.innerHTML = sliders.map((slider, index) => `
    <div class="slider-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${slider.image}" alt="${slider.title}" class="slider-image">
      <div class="slider-overlay"></div>
      <div class="slider-content">
        <h1 class="slider-title">${slider.title}</h1>
        ${slider.description ? `<p class="slider-description">${slider.description}</p>` : ''}
        ${slider.linkUrl ? `
          <a href="${slider.linkUrl}" class="slider-link">
            ${slider.linkText || 'Read Now'} <i class="fas fa-arrow-right"></i>
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  // Create dots
  const dotsContainer = document.getElementById('sliderDots');
  dotsContainer.innerHTML = sliders.map((_, index) => `
    <button class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></button>
  `).join('');
}

// Next slide
function nextSlide() {
  currentSlide = (currentSlide + 1) % sliders.length;
  updateSlide();
  resetAutoSlide();
}

// Previous slide
function prevSlide() {
  currentSlide = (currentSlide - 1 + sliders.length) % sliders.length;
  updateSlide();
  resetAutoSlide();
}

// Go to specific slide
function goToSlide(index) {
  currentSlide = index;
  updateSlide();
  resetAutoSlide();
}

// Update slide display
function updateSlide() {
  const slides = document.querySelectorAll('.slider-slide');
  const dots = document.querySelectorAll('.slider-dot');
  
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
  });
  
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

// Start auto slide
function startAutoSlide() {
  if (sliders.length <= 1) return;
  
  sliderInterval = setInterval(() => {
    nextSlide();
  }, 5000); // Change slide every 5 seconds
}

// Reset auto slide
function resetAutoSlide() {
  clearInterval(sliderInterval);
  startAutoSlide();
}

// Stop auto slide on hover
document.addEventListener('DOMContentLoaded', () => {
  loadSliders();
  
  const sliderContainer = document.querySelector('.slider-container');
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', () => {
      clearInterval(sliderInterval);
    });
    
    sliderContainer.addEventListener('mouseleave', () => {
      startAutoSlide();
    });
  }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (sliders.length === 0) return;
  
  if (e.key === 'ArrowLeft') {
    prevSlide();
  } else if (e.key === 'ArrowRight') {
    nextSlide();
  }
});

