
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category");
const productCards = document.querySelectorAll(".product-card");
const emptyMessage = document.getElementById("emptyMessage");

let selectedCategory = "all";

function filterProducts() {
    const keyword = searchInput.value.toLowerCase();
    let visibleCount = 0;

    productCards.forEach(card => {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const category = card.dataset.category;

        const matchName = name.includes(keyword);
        const matchCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        if (matchName && matchCategory) {
            card.style.display = "block";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    emptyMessage.hidden = visibleCount !== 0;
}

searchInput.addEventListener("input", filterProducts);

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");
        selectedCategory = button.dataset.category;

        filterProducts();
    });
});

// Ganti nomor ini dengan nomor WhatsApp toko
const whatsappNumber = "6281234567890";

document.querySelectorAll(".order-button").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const product = button.dataset.product;

        const message = `Halo Sampaikan Bouquet, saya ingin memesan ${product}. Apakah produknya tersedia?`;

        const url =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(url, "_blank");
    });
});
