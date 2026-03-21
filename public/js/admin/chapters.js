// Load manga info and chapters
async function loadMangaInfo() {
  try {
    const response = await fetch(`/api/manga/${mangaId}`);
    const data = await response.json();

    document.getElementById("mangaInfo").innerHTML = `
      <div class="manga-info-header">
        <img src="${data.manga.coverImage}" alt="${data.manga.title}">
        <div>
          <h2>${data.manga.title}</h2>
          <p>tác giả ${data.manga.author}</p>
          <a href="/manga/${mangaId}" class="btn btn-sm btn-secondary">Xem Truyện</a>
        </div>
      </div>
    `;

    loadChapters(data.chapters);
  } catch (error) {
    console.error("Error loading manga info:", error);
    document.getElementById("mangaInfo").innerHTML =
      '<p class="error">Không thể tải thông tin truyện.</p>';
  }
}

// Load chapters list
function loadChapters(chapters) {
  const container = document.getElementById("chaptersList");

  if (chapters.length === 0) {
    container.innerHTML =
      '<p class="no-results">Chưa có chapter nào. Thêm chapter đầu tiên ở trên.</p>';
    return;
  }

  container.innerHTML = chapters
    .map(
      (chapter) => `
    <div class="chapter-card">
      <div class="chapter-info">
        <h3>Chapter ${chapter.chapterNumber}${
        chapter.title ? ": " + chapter.title : ""
      }</h3>
        <p>${chapter.pages.length} trang • Phát hành ${formatDate(
        chapter.releaseDate
      )}</p>
      </div>
      <div class="chapter-actions">
        <a href="/read/${
          chapter._id
        }" class="btn btn-sm btn-secondary" target="_blank">
          <i class="fas fa-eye"></i> Xem
        </a>
        <button class="btn btn-sm btn-danger" onclick="deleteChapter('${
          chapter._id
        }')">
          <i class="fas fa-trash"></i> Xóa
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// Store files array for reordering
let filesArray = [];

// Preview pages with drag-to-reorder
document.getElementById("pages")?.addEventListener("change", function (e) {
  filesArray = Array.from(e.target.files);

  // Automatically sort by filename (natural/numeric sort)
  filesArray.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  updatePreview();
});

function updatePreview() {
  const preview = document.getElementById("pagesPreview");
  preview.innerHTML = "";

  filesArray.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const div = document.createElement("div");
      div.className = "page-preview-item";
      div.draggable = true;
      div.dataset.index = index;
      div.innerHTML = `
        <img src="${e.target.result}" alt="Page ${index + 1}">
        <span>Trang ${index + 1}</span>
        <div class="drag-indicator"><i class="fas fa-grip-vertical"></i></div>
      `;

      // Drag events
      div.addEventListener("dragstart", handleDragStart);
      div.addEventListener("dragover", handleDragOver);
      div.addEventListener("drop", handleDrop);
      div.addEventListener("dragend", handleDragEnd);

      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

// Drag and drop handlers
let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  const item = e.currentTarget;
  if (item.classList.contains("page-preview-item")) {
    item.classList.add("drag-over");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const dropIndex = parseInt(e.currentTarget.dataset.index);

  if (draggedIndex !== null && draggedIndex !== dropIndex) {
    // Reorder files
    const [movedFile] = filesArray.splice(draggedIndex, 1);
    filesArray.splice(dropIndex, 0, movedFile);
    updatePreview();
  }

  e.currentTarget.classList.remove("drag-over");
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document.querySelectorAll(".page-preview-item").forEach((item) => {
    item.classList.remove("drag-over");
  });
  draggedIndex = null;
}

// Handle add chapter
async function handleAddChapter(event) {
  event.preventDefault();

  if (filesArray.length === 0) {
    showError("errorMessage", "Vui lòng chọn ít nhất 1 trang");
    return;
  }

  const fd = new FormData();
  filesArray.forEach((file) => fd.append("pages", file));

  // Upload pages lên CDN
  const uploadRes = await fetch("/api/uploads/pages", {
    method: "POST",
    body: fd,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    showError("errorMessage", uploadData.error);
    return;
  }

  const pageURLs = uploadData.urls;

  // Gửi dữ liệu chapter lên BE
  const response = await fetch(`/api/admin/manga/${mangaId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapterNumber: document.getElementById("chapterNumber").value,
      title: document.getElementById("chapterTitle").value,
      pages: pageURLs,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showError("errorMessage", data.error || "Không thể thêm chapter");
    return;
  }

  showSuccess("successMessage", "Thêm chapter thành công!");
  setTimeout(() => location.reload(), 1500);
}

// Delete chapter
async function deleteChapter(chapterId) {
  if (
    !confirm(
      "Bạn có chắc chắn muốn xóa chapter này? Hành động này không thể hoàn tác."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/chapters/${chapterId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Xóa chapter thành công");
      location.reload();
    } else {
      const data = await response.json();
      alert(data.error || "Không thể xóa chapter");
    }
  } catch (error) {
    console.error("Error deleting chapter:", error);
    alert("Đã xảy ra lỗi");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadMangaInfo);
