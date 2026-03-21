let chapter = null;
let currentPage = 0;
let pages = [];
let allChapters = [];
let prevChapter = null;
let nextChapter = null;

// Reader settings
let settings = {
  readingMode: localStorage.getItem('readingMode') || 'page-flip',
  readingDirection: localStorage.getItem('readingDirection') || 'rtl',
  pageDisplay: localStorage.getItem('pageDisplay') || 'fit-width',
  backgroundColor: localStorage.getItem('backgroundColor') || 'black'
};

let hideToolbarTimeout = null;
let settingsPanelVisible = false;

// Load chapter
async function loadChapter() {
  try {
    const response = await fetch(`/api/chapters/${chapterId}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    chapter = data.chapter;
    pages = chapter.pages;
    allChapters = data.allChapters;
    prevChapter = data.prevChapter;
    nextChapter = data.nextChapter;
    
    document.getElementById('mangaTitle').textContent = 
      `${chapter.mangaId.title} - Chapter ${chapter.chapterNumber}`;
    
    updateChapterSelect();
    updateNavigationButtons();
    applySettings();
    displayPages();
    
    // Load saved progress
    const savedPage = await getSavedProgress();
    if (savedPage > 0) {
      currentPage = savedPage;
      updatePageDisplay();
    }
    
    setupKeyboardControls();
    setupAutoHide();
  } catch (error) {
    console.error('Error loading chapter:', error);
    document.getElementById('pageContainer').innerHTML = '<p class="error">Failed to load chapter.</p>';
  }
}

// Display pages based on reading mode
function displayPages() {
  const container = document.getElementById('pageContainer');
  const readerContainer = document.getElementById('readerContainer');
  
  if (settings.readingMode === 'vertical-scroll') {
    // Vertical scroll mode
    container.innerHTML = pages.map((page, index) => `
      <img src="${page}" 
           alt="Page ${index + 1}" 
           class="manga-page vertical-page"
           data-page="${index}"
           loading="lazy">
    `).join('');
    
    readerContainer.classList.add('vertical-scroll');
    readerContainer.classList.remove('page-flip');
    
    // Setup scroll tracking
    setupScrollTracking();
  } else {
    // Page flip mode
    container.innerHTML = `
      <img src="${pages[currentPage]}" 
           alt="Page ${currentPage + 1}" 
           class="manga-page flip-page"
           id="currentPageImg">
    `;
    
    readerContainer.classList.add('page-flip');
    readerContainer.classList.remove('vertical-scroll');
  }
  
  updatePageIndicator();
}

// Update page display
function updatePageDisplay() {
  if (settings.readingMode === 'page-flip') {
    const img = document.getElementById('currentPageImg');
    if (img) {
      img.src = pages[currentPage];
      img.alt = `Page ${currentPage + 1}`;
    }
  }
  updatePageIndicator();
  saveProgress();
}

// Navigation functions
function nextPage() {
  if (settings.readingMode === 'vertical-scroll') {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  } else {
    if (settings.readingDirection === 'rtl') {
      if (currentPage > 0) {
        currentPage--;
        updatePageDisplay();
      } else if (prevChapter) {
        window.location.href = `/read/${prevChapter._id}`;
      }
    } else {
      if (currentPage < pages.length - 1) {
        currentPage++;
        updatePageDisplay();
      } else if (nextChapter) {
        window.location.href = `/read/${nextChapter._id}`;
      }
    }
  }
}

function prevPage() {
  if (settings.readingMode === 'vertical-scroll') {
    window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
  } else {
    if (settings.readingDirection === 'rtl') {
      if (currentPage < pages.length - 1) {
        currentPage++;
        updatePageDisplay();
      } else if (nextChapter) {
        window.location.href = `/read/${nextChapter._id}`;
      }
    } else {
      if (currentPage > 0) {
        currentPage--;
        updatePageDisplay();
      } else if (prevChapter) {
        window.location.href = `/read/${prevChapter._id}`;
      }
    }
  }
}

function goToNextChapter() {
  if (nextChapter) {
    window.location.href = `/read/${nextChapter._id}`;
  }
}

function goToPrevChapter() {
  if (prevChapter) {
    window.location.href = `/read/${prevChapter._id}`;
  }
}

function changeChapter(selectedChapterId) {
  if (selectedChapterId && selectedChapterId !== chapterId) {
    window.location.href = `/read/${selectedChapterId}`;
  }
}

// Update UI elements
function updatePageIndicator() {
  const indicator = document.getElementById('pageIndicator');
  if (settings.readingMode === 'vertical-scroll') {
    indicator.textContent = `${pages.length} pages`;
  } else {
    indicator.textContent = `${currentPage + 1} / ${pages.length}`;
  }
}

function updateChapterSelect() {
  const select = document.getElementById('chapterSelect');
  select.innerHTML = allChapters.map(ch => `
    <option value="${ch._id}" ${ch._id === chapterId ? 'selected' : ''}>
      Chapter ${ch.chapterNumber}${ch.title ? ': ' + ch.title : ''}
    </option>
  `).join('');
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevChapterBtn');
  const nextBtn = document.getElementById('nextChapterBtn');
  
  prevBtn.disabled = !prevChapter;
  nextBtn.disabled = !nextChapter;
}

// Settings functions
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  settingsPanelVisible = !settingsPanelVisible;
  panel.style.display = settingsPanelVisible ? 'block' : 'none';
}

function setReadingMode(mode) {
  settings.readingMode = mode;
  localStorage.setItem('readingMode', mode);
  updateSettingButtons('mode', mode);
  displayPages();
  applySettings();
}

function setReadingDirection(direction) {
  settings.readingDirection = direction;
  localStorage.setItem('readingDirection', direction);
  updateSettingButtons('direction', direction);
}

function setPageDisplay(display) {
  settings.pageDisplay = display;
  localStorage.setItem('pageDisplay', display);
  updateSettingButtons('display', display);
  applySettings();
}

function setBackground(color) {
  settings.backgroundColor = color;
  localStorage.setItem('backgroundColor', color);
  updateSettingButtons('bg', color);
  applySettings();
}

function updateSettingButtons(type, value) {
  const buttons = document.querySelectorAll(`.setting-btn[data-${type}]`);
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute(`data-${type}`) === value);
  });
}

function applySettings() {
  const container = document.getElementById('readerContainer');
  const body = document.body;
  
  // Apply background
  body.setAttribute('data-reader-bg', settings.backgroundColor);
  
  // Apply page display
  container.setAttribute('data-page-display', settings.pageDisplay);
  
  // Apply reading direction
  container.setAttribute('data-reading-direction', settings.readingDirection);
}

// Keyboard controls
function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    if (settingsPanelVisible) return;
    
    switch(e.key) {
      case 'ArrowRight':
        if (settings.readingDirection === 'rtl') {
          prevPage();
        } else {
          nextPage();
        }
        break;
      case 'ArrowLeft':
        if (settings.readingDirection === 'rtl') {
          nextPage();
        } else {
          prevPage();
        }
        break;
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        nextPage();
        break;
      case 'ArrowUp':
        e.preventDefault();
        prevPage();
        break;
      case 'Escape':
        goBack();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });
}

// Auto-hide toolbar
function setupAutoHide() {
  const toolbar = document.getElementById('readerToolbar');
  const chapterNav = document.getElementById('chapterNav');
  
  document.addEventListener('mousemove', () => {
    toolbar.classList.remove('hidden');
    chapterNav.classList.remove('hidden');
    
    clearTimeout(hideToolbarTimeout);
    hideToolbarTimeout = setTimeout(() => {
      if (!settingsPanelVisible) {
        toolbar.classList.add('hidden');
        chapterNav.classList.add('hidden');
      }
    }, 3000);
  });
}

// Scroll tracking for vertical mode
function setupScrollTracking() {
  let scrollTimeout;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Find which page is most visible
      const pageImages = document.querySelectorAll('.manga-page');
      let maxVisibleArea = 0;
      let mostVisiblePage = 0;
      
      pageImages.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visibleArea = visibleHeight * rect.width;
        
        if (visibleArea > maxVisibleArea) {
          maxVisibleArea = visibleArea;
          mostVisiblePage = index;
        }
      });
      
      currentPage = mostVisiblePage;
      saveProgress();
    }, 500);
  });
}

// Save reading progress
async function saveProgress() {
  try {
    await fetch(`/api/chapters/${chapterId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pageNumber: currentPage })
    });
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// Get saved progress
async function getSavedProgress() {
  try {
    const response = await fetch(`/api/manga/${chapter.mangaId._id}`);
    const data = await response.json();
    
    if (data.readingHistory && data.readingHistory.chapterId === chapterId) {
      return data.readingHistory.pageNumber || 0;
    }
  } catch (error) {
    console.error('Error getting saved progress:', error);
  }
  return 0;
}

// Other functions
function goBack() {
  if (chapter && chapter.mangaId) {
    window.location.href = `/manga/${chapter.mangaId._id}`;
  } else {
    window.history.back();
  }
}


// Download chapter as ZIP
async function downloadChapter() {
  try {
    // Show loading state
    const downloadBtn = document.querySelector('.toolbar-btn[title="Tải xuống chapter"]');
    const icon = downloadBtn.querySelector('i');
    const originalIcon = icon.className;
    
    icon.className = 'fas fa-spinner fa-spin';
    downloadBtn.disabled = true;
    
    // Trigger download
    const response = await fetch(`/api/chapters/download/${chapterId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }
    
    // Get the blob from response
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'chapter.zip';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Restore button state
    icon.className = originalIcon;
    downloadBtn.disabled = false;
    
  } catch (error) {
    console.error('Error downloading chapter:', error);
    
    // Restore button state
    const downloadBtn = document.querySelector('.toolbar-btn[title="Tải xuống chapter"]');
    const icon = downloadBtn.querySelector('i');
    icon.className = 'fas fa-download';
    downloadBtn.disabled = false;
    
    // Show error message
    if (error.message.includes('Unauthorized')) {
      alert('Bạn cần đăng nhập để tải xuống chapter');
    } else {
      alert('Không thể tải xuống chapter. Vui lòng thử lại sau.');
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    document.querySelector('.toolbar-btn[title="Fullscreen"] i').className = 'fas fa-compress';
  } else {
    document.exitFullscreen();
    document.querySelector('.toolbar-btn[title="Fullscreen"] i').className = 'fas fa-expand';
  }
}

// Initialize reader
document.addEventListener('DOMContentLoaded', () => {
  loadChapter();
  
  // Load saved settings into UI
  updateSettingButtons('mode', settings.readingMode);
  updateSettingButtons('direction', settings.readingDirection);
  updateSettingButtons('display', settings.pageDisplay);
  updateSettingButtons('bg', settings.backgroundColor);
});

// Save progress before leaving
window.addEventListener('beforeunload', () => {
  saveProgress();
});

