// Preview slider image
document.getElementById("image")?.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById(
        "imagePreview"
      ).innerHTML = `<img src="${e.target.result}" alt="Slider Preview" style="max-width: 400px; max-height: 200px;">`;
    };
    reader.readAsDataURL(file);
  }
});

// Load sliders
async function loadSliders() {
  try {
    const response = await fetch("/api/admin/sliders");
    const sliders = await response.json();

    const container = document.getElementById("slidersList");

    if (sliders.length === 0) {
      container.innerHTML =
        '<p class="no-results">Chưa có slider nào. Tạo slider đầu tiên ở trên.</p>';
      return;
    }

    container.innerHTML = sliders
      .map(
        (slider) => `
      <div class="slider-card">
        <div class="slider-preview">
          <img src="${slider.image}" alt="${slider.title}">
        </div>
        <div class="slider-info">
          <h3>${slider.title}</h3>
          <p>${slider.description || "Không có mô tả"}</p>
          <div class="slider-meta">
            <span>Thứ tự: ${slider.order}</span>
            ${slider.linkUrl ? `<span>Liên kết: ${slider.linkUrl}</span>` : ""}
          </div>
        </div>
        <div class="slider-actions">
          <button class="btn btn-sm btn-primary" onclick="editSlider('${
            slider._id
          }')" title="Chỉnh Sửa">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteSlider('${
            slider._id
          }')" title="Xóa">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading sliders:", error);
    document.getElementById("slidersList").innerHTML =
      '<p class="error">Không thể tải danh sách slider.</p>';
  }
}

// Handle add slider
async function handleAddSlider(event) {
  event.preventDefault();

  const form = document.getElementById("addSliderForm");
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Đang xử lý...";
  }

  showError("errorMessage", "");
  showSuccess("successMessage", "");

  // Get the file
  const sliderFile = document.getElementById("image").files[0];
  if (!sliderFile) {
    showError("errorMessage", "Vui lòng chọn ảnh slider");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm slider";
    }
    return;
  }

  // Build FormData with all fields + file
  const formData = new FormData();
  formData.append("image", sliderFile);
  formData.append("title", form.title.value.trim());
  formData.append("description", form.description.value.trim());
  formData.append("linkUrl", form.linkUrl.value.trim());
  formData.append("linkText", form.linkText.value.trim() || "Read Now");
  formData.append("order", form.order.value || 0);

  try {
    const response = await fetch("/api/admin/sliders", {
      method: "POST",
      body: formData, // send as multipart/form-data
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("successMessage", "Thêm slider thành công!");
      form.reset();
      document.getElementById("imagePreview").innerHTML = "";
      loadSliders();
    } else {
      showError("errorMessage", data.error || "Không thể thêm slider");
    }
  } catch (err) {
    console.error(err);
    showError("errorMessage", "Đã xảy ra lỗi khi tạo slider");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Thêm slider";
    }
  }
}

// Delete slider
async function deleteSlider(sliderId) {
  if (!confirm("Bạn có chắc chắn muốn xóa slider này?")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/sliders/${sliderId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Xóa slider thành công");
      loadSliders();
    } else {
      const data = await response.json();
      alert(data.error || "Không thể xóa slider");
    }
  } catch (error) {
    console.error("Error deleting slider:", error);
    alert("Đã xảy ra lỗi");
  }
}

// Edit slider (simple version - can be enhanced)
function editSlider(sliderId) {
  alert(
    "Để chỉnh sửa: Xóa slider này và tạo mới, hoặc triển khai modal chỉnh sửa đầy đủ"
  );
  // TODO: Implement edit modal with pre-filled form
}

// Initialize
document.addEventListener("DOMContentLoaded", loadSliders);
