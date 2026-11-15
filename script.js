
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.querySelector(".nav-menu");

menuToggle.addEventListener("click", function () {
    navMenu.classList.toggle("active");
});

// Menutup menu setelah link diklik
document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", function () {
        navMenu.classList.remove("active");
    });
});
