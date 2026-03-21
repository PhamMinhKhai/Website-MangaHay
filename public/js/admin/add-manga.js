console.log("add-manga.js loaded");
// Preview cover image
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

// Helper: show error
function showError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// Helper: show success
function showSuccess(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// Upload cover to CDN (or /uploads) and return URL
async function uploadCover(file) {
  const formData = new FormData();
  formData.append("cover", file);

  const response = await fetch("/api/uploads/covers", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload cover failed");
  }

  return data.url;
}
// Handle form submission
async function handleAddManga(event) {
  event.preventDefault();

  const form = document.getElementById("addMangaForm");

  // === GIẢI PHÁP BẮT ĐẦU TỪ ĐÂY ===
  // 1. Lấy nút submit và vô hiệu hóa nó
  const submitButton = form.querySelector('button[type="submit"]'); // Giả sử nút của bạn có type="submit"
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Đang xử lý, vui lòng chờ...";
  }

  // Xóa các thông báo lỗi/thành công cũ
  showError("errorMessage", "");
  showSuccess("successMessage", ""); // Lấy file cover
  // === KẾT THÚC PHẦN THÊM MỚI ===

  const coverFile = document.getElementById("cover").files[0];
  if (!coverFile) {
    showError("errorMessage", "Vui lòng chọn ảnh bìa");
    // 2. Mở lại nút nếu có lỗi
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm truyện"; // Trả lại text cũ
    }
    return;
  } // Upload cover trước

  let coverURL;
  try {
    coverURL = await uploadCover(coverFile);
  } catch (err) {
    console.error(err);
    showError("errorMessage", "Tải ảnh bìa thất bại: " + err.message);
    // 3. Mở lại nút nếu có lỗi
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm truyện";
    }
    return;
  } // Lấy các field còn lại

  const title = form.title.value.trim();
  const author = form.author.value.trim();
  const description = form.description.value.trim();
  const status = form.status.value; // Lấy genres đã chọn

  const genres = Array.from(
    document.querySelectorAll('input[name="genres"]:checked')
  ).map((cb) => cb.value);

  if (genres.length === 0) {
    showError("errorMessage", "Vui lòng chọn ít nhất một thể loại");
    // 4. Mở lại nút nếu có lỗi
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm truyện";
    }
    return;
  } // Gửi API tạo manga với coverImage là URL

  try {
    const response = await fetch("/api/admin/manga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        description,
        status,
        genres,
        coverImage: coverURL,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      showSuccess("successMessage", "Thêm truyện thành công!");
      // 5. Thành công, không cần mở lại nút vì sắp chuyển trang
      setTimeout(() => {
        window.location.href = `/admin/manga/${data.manga._id}/chapters`;
      }, 1500);
    } else {
      showError("errorMessage", data.error || "Không thể thêm truyện");
      // 6. Mở lại nút nếu API trả về lỗi
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Thêm truyện";
      }
    }
  } catch (err) {
    console.error(err);
    showError("errorMessage", "Đã xảy ra lỗi khi tạo truyện");
    // 7. Mở lại nút nếu fetch bị lỗi
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm truyện";
    }
  }
}
