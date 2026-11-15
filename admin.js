
const SUPABASE_URL = "https://bxjnpfvjlojkesackbsa.supabase.co";
const SUPABASE_KEY = "sb_publishable_fZJ1VvPJX4zm1xwgagFoew_av3LCfik";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = "adminbouquet";
const ADMIN_EMAIL = "vanecha306@gmail.com";
const BUCKET = "product-images";

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
const productForm = document.getElementById("productForm");
const formMessage = document.getElementById("formMessage");
const productList = document.getElementById("productList");

function showDashboard(show) {
  loginSection.hidden = show;
  dashboardSection.hidden = !show;
  logoutButton.hidden = !show;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);
}

async function verifyAdmin() {
  const { data, error } = await db.rpc("is_admin");

  if (error || data !== true) {
    await db.auth.signOut();
    showDashboard(false);
    return false;
  }

  showDashboard(true);
  await loadProducts();
  return true;
}

// LOGIN
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginMessage.textContent = "Sedang masuk...";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username !== ADMIN_USERNAME) {
    loginMessage.textContent = "Username atau password salah.";
    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });

  if (error) {
    loginMessage.textContent = "Login gagal. Periksa username dan password.";
    return;
  }

  const success = await verifyAdmin();

  if (success) {
    loginForm.reset();
    loginMessage.textContent = "";
  } else {
    loginMessage.textContent = "Akun ini belum memiliki akses admin.";
  }
});

// LOGOUT
logoutButton.addEventListener("click", async () => {
  await db.auth.signOut();
  showDashboard(false);
  loginMessage.textContent = "Kamu sudah logout.";
});

// AMBIL PRODUK
async function loadProducts() {
  productList.innerHTML = "<p>Memuat produk...</p>";

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    productList.innerHTML = "<p>Gagal memuat produk.</p>";
    console.error(error);
    return;
  }

  if (!data.length) {
    productList.innerHTML = "<p>Belum ada produk. Yuk, tambahkan produk pertama!</p>";
    return;
  }

  productList.innerHTML = data.map(product => `
    <article class="product-card">
      <img
        src="${escapeHTML(product.image_url || "")}"
        alt="${escapeHTML(product.name)}"
        onerror="this.style.display='none'"
      >
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${formatPrice(product.price)}</p>
        <p>Kategori: ${escapeHTML(product.category)}</p>
        <p>${product.is_active ? "Aktif" : "Tidak aktif"}</p>
        <div class="product-actions">
          <button class="edit-button" data-action="edit" data-id="${product.id}">
            EDIT
          </button>
          <button class="delete-button" data-action="delete" data-id="${product.id}">
            HAPUS
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// SIMPAN / EDIT PRODUK
productForm.addEventListener("submit", async event => {
  event.preventDefault();

  const saveButton = document.getElementById("saveButton");
  saveButton.disabled = true;
  saveButton.textContent = "MENYIMPAN...";
  formMessage.textContent = "";

  try {
    const id = document.getElementById("productId").value;
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const category = document.getElementById("productCategory").value;
    const description = document.getElementById("productDescription").value.trim();
    const imageFile = document.getElementById("productImage").files[0];

    if (!name || !Number.isFinite(price) || price < 0) {
      throw new Error("Nama dan harga produk harus valid.");
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      throw new Error("Ukuran foto maksimal 5 MB.");
    }

    let imageUrl = "";

    if (id) {
      const { data: oldProduct, error } = await db
        .from("products")
        .select("image_url")
        .eq("id", id)
        .single();

      if (error) throw error;
      imageUrl = oldProduct.image_url || "";
    }

    if (imageFile) {
      const extension = imageFile.name.split(".").pop().toLowerCase();
      const filePath = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = db.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const productData = {
      name,
      price,
      category,
      description,
      image_url: imageUrl
    };

    let result;

    if (id) {
      result = await db
        .from("products")
        .update(productData)
        .eq("id", id);
    } else {
      result = await db
        .from("products")
        .insert(productData);
    }

    if (result.error) throw result.error;

    formMessage.textContent = "Produk berhasil disimpan!";
    resetProductForm();
    await loadProducts();

  } catch (error) {
    console.error(error);
    formMessage.textContent = error.message || "Terjadi kesalahan.";
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "SIMPAN PRODUK";
  }
});

// KLIK EDIT / HAPUS
productList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Gagal mengambil data produk.");
      return;
    }

    document.getElementById("productId").value = data.id;
    document.getElementById("productName").value = data.name;
    document.getElementById("productPrice").value = data.price;
    document.getElementById("productCategory").value = data.category;
    document.getElementById("productDescription").value = data.description || "";
    document.getElementById("formTitle").textContent = "Edit Produk";
    document.getElementById("cancelButton").hidden = false;

    document.getElementById("productForm").scrollIntoView({
      behavior: "smooth"
    });
  }

  if (action === "delete") {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    const { error } = await db
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus produk: " + error.message);
      return;
    }

    await loadProducts();
  }
});

// RESET FORM
function resetProductForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("formTitle").textContent = "Tambah Produk Baru";
  document.getElementById("cancelButton").hidden = true;
}

document.getElementById("cancelButton").addEventListener("click", resetProductForm);
document.getElementById("refreshButton").addEventListener("click", loadProducts);

// CEK SESI LOGIN SAAT HALAMAN DIBUKA
(async function init() {
  showDashboard(false);

  const { data } = await db.auth.getSession();

  if (data.session) {
    await verifyAdmin();
  }
})();
