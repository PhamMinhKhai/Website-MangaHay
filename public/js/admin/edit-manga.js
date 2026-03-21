// Load manga data
async function loadManga() {
  try {
    const response = await fetch(`/api/manga/${mangaId}`);
    const data = await response.json();
    const manga = data.manga;

    const container = document.getElementById("editMangaForm");

    container.innerHTML = `
      <form class="admin-form" enctype="multipart/form-data" onsubmit="handleEditManga(event)">
        <div class="form-group">
          <label for="title">Tiêu Đề *</label>
          <input type="text" id="title" name="title" value="${
            manga.title
          }" required>
        </div>

        <div class="form-group">
          <label for="author">Tác Giả *</label>
          <input type="text" id="author" name="author" value="${
            manga.author
          }" required>
        </div>

        <div class="form-group">
          <label for="description">Mô Tả *</label>
          <textarea id="description" name="description" rows="5" required>${
            manga.description
          }</textarea>
        </div>

        <div class="form-group">
          <label for="cover">Ảnh Bìa (để trống để giữ ảnh hiện tại)</label>
          <div class="current-cover">
            <img src="${manga.coverImage}" alt="Ảnh Bìa Hiện Tại">
          </div>
          <input type="file" id="cover" name="cover" accept="image/*">
          <div id="coverPreview" class="image-preview"></div>
        </div>

        <div class="form-group">
          <label>Thể Loại * (Chọn nhiều)</label>
          <div class="genre-checkboxes">
${[
              "Hành động",
              "Phiêu lưu",
              "Hài hước",
              "Chính kịch",
              "Lãng mạn",
              "Giả tưởng",
              "Kinh dị",
              "Bí ẩn",
              "Tâm lý",
              "Khoa học viễn tưởng",
              "Đời thường",
              "Siêu nhiên",
              "Thể thao",
              "Robot",
            ]
              .map(
                (genre) => `
              <label>
                <input type="checkbox" name="genres" value="${genre}" ${
                  manga.genres.includes(genre) ? "checked" : ""
                }> ${genre}
              </label>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="form-group">
          <label for="status">Trạng Thái *</label>
          <select id="status" name="status" required>
            <option value="Ongoing" ${
              manga.status === "Ongoing" ? "selected" : ""
            }>Đang Tiến Hành</option>
            <option value="Completed" ${
              manga.status === "Completed" ? "selected" : ""
            }>Hoàn Thành</option>
          </select>
        </div>

        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Cập Nhật Truyện</button>
          <a href="/admin/manga/${mangaId}/chapters" class="btn btn-secondary">Quản Lý Chapter</a>
          <a href="/admin/manga" class="btn btn-secondary">Hủy</a>
        </div>
      </form>
    `;

    // Setup cover preview
    document.getElementById("cover")?.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById(
            "coverPreview"
          ).innerHTML = `<img src="${e.target.result}" alt="Cover Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
  } catch (error) {
    console.error("Error loading manga:", error);
    document.getElementById("editMangaForm").innerHTML =
      '<p class="error">Không thể tải truyện.</p>';
  }
}

// Handle form submission
async function handleEditManga(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const description = document.getElementById("description").value.trim();
  const status = document.getElementById("status").value;
  const coverFile = document.getElementById("cover").files[0];

  // Genres
  const genres = Array.from(
    document.querySelectorAll('input[name="genres"]:checked')
  ).map((cb) => cb.value);

  if (genres.length === 0) {
    showError("errorMessage", "Vui lòng chọn ít nhất một thể loại");
    return;
  }

  let coverImageURL = null;

  // Nếu upload ảnh mới
  if (coverFile) {
    const fd = new FormData();
    fd.append("cover", coverFile);

    const res = await fetch("/api/uploads/covers", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      showError("errorMessage", data.error);
      return;
    }

    coverImageURL = data.url;
  }

  // Gửi update
  const response = await fetch(`/api/admin/manga/${mangaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      author,
      description,
      status,
      genres,
      ...(coverImageURL && { coverImage: coverImageURL }),
    }),
  });

  const data = await response.json();

  if (response.ok) {
    showSuccess("successMessage", "Cập nhật truyện thành công!");
    setTimeout(() => {
      window.location.href = "/admin/manga";
    }, 1500);
  } else {
    showError("errorMessage", data.error || "Không thể cập nhật truyện");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadManga);
