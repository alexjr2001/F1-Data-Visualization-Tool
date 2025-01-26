document.addEventListener("DOMContentLoaded", () => {
    const slideArrow = document.getElementById("slideArrow");
    const introScreen = document.getElementById("introScreen");

    slideArrow.addEventListener("click", () => {
        // Desactivar animación de rebote temporalmente
        introScreen.style.animation = "none";

        // Desplazar la pantalla hacia arriba y ocultarla
        setTimeout(() => {
            introScreen.style.transform = "translateY(-100vh)";
            setTimeout(() => {
                introScreen.style.display = "none";
            }, 800); // Tiempo de la transición (0.8s)
        }, 100); // Espera breve antes de aplicar la transición
    });
});
