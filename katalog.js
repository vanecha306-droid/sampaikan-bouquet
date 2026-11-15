
// KONEKSI SUPABASE
const SUPABASE_URL = "https://bxjnpfvjlojkesackbsa.supabase.co";
const SUPABASE_KEY = "sb_publishable_fZJ1VvPJX4zm1xwgagFoew_av3LCfik";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// NOMOR WHATSAPP TOKO
const whatsappNumber = "6281234567890";

// ELEMENT HTML
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category");
const productGrid = document.getElementById("productGrid");
const emptyMessage = document.getElementById("emptyMessage");

let allProducts = [];
let selectedCategory = "all";

// FORMAT HARGA
function formatPrice(price) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(price);
}

// AMAN UNTUK MENAMPILKAN TEKS
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// LABEL KATEGORI
function categoryLabel(category) {
    const labels = {
        flower: "FLOWER BOUQUET",
        money: "MONEY BOUQUET",
        snack: "SNACK BOUQUET"
    };

    return labels[category] || category.toUpperCase();
}

// AMBIL PRODUK DARI SUPABASE
async function loadProducts() {
    productGrid.innerHTML = "<p>Memuat katalog...</p>";
    emptyMessage.hidden = true;

    const { data, error } = await db
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal mengambil produk:", error);
        productGrid.innerHTML =
            "<p>Katalog belum dapat dimuat. Silakan coba lagi.</p>";
        return;
    }

    allProducts = data || [];

    renderProducts();
}

// TAMPILKAN PRODUK
function renderProducts() {
    const keyword = searchInput.value.toLowerCase().trim();

    const filteredProducts = allProducts.filter(product => {
        const matchName = product.name.toLowerCase().includes(keyword);

        const matchCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchName && matchCategory;
    });

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = "";
        emptyMessage.hidden = false;
        return;
    }

    emptyMessage.hidden = true;

    productGrid.innerHTML = filteredProducts.map(product => {
        const image = product.image_url || "";

        return `
            <article class="product-card" data-category="${escapeHTML(product.category)}">

                <div class="product-image">
                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(product.name)}"
                        onerror="this.style.display='none'"
                    >
                </div>

                <div class="product-info">

                    <p class="product-category">
                        ${escapeHTML(categoryLabel(product.category))}
                    </p>

                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="price">
                        ${formatPrice(product.price)}
                    </p>

                    <a href="#" class="order-button"
                       data-product="${escapeHTML(product.name)}">
                        PESAN SEKARANG
                    </a>

                </div>
            </article>
        `;
    }).join("");
}

// PENCARIAN PRODUK
searchInput.addEventListener("input", renderProducts);

// FILTER KATEGORI
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        selectedCategory = button.dataset.category;

        renderProducts();
    });
});

// PESAN MELALUI WHATSAPP
productGrid.addEventListener("click", event => {
    const button = event.target.closest(".order-button");

    if (!button) return;

    event.preventDefault();

    const product = button.dataset.product;

    const message =
        `Halo Sampaikan Bouquet, saya ingin memesan ${product}. Apakah produknya tersedia?`;

    const url =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
});

// JALANKAN KATALOG
loadProducts();
