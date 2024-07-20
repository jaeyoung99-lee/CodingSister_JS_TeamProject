const overlay = document.querySelector(".overlay");
const sideNav = document.getElementById("mainSidenav");
const dropdown = document.querySelector(".dropdown_bar");
const dropdownContent = document.querySelector(".dropdown_content");
const drop_icon1 = document.querySelector(".drop_icon1");
const drop_icon2 = document.querySelector(".drop_icon2");

const openNav = () => {
  sideNav.style.width = "250px";
  overlay.style.display = "block";
  overlay.style.opacity = 0;

  const fadeEffect = setInterval(() => {
    if (!overlay.style.opacity) {
      overlay.style.opacity = 0;
    }
    if (overlay.style.opacity < 0.5) {
      overlay.style.opacity = parseFloat(overlay.style.opacity) + 0.1;
    } else {
      clearInterval(fadeEffect);
    }
  }, 50);

  overlay.addEventListener("click", () => {
    sideNav.style.width = "0px";
    const fadeOutEffect = setInterval(() => {
      if (overlay.style.opacity > 0) {
        overlay.style.opacity -= 0.1;
      } else {
        clearInterval(fadeOutEffect);
        overlay.style.display = "none";
      }
    }, 50);
  });
};

const closeNav = () => {
  sideNav.style.width = "0px";
  const fadeOutEffect = setInterval(() => {
    if (overlay.style.opacity > 0) {
      overlay.style.opacity -= 0.1;
    } else {
      clearInterval(fadeOutEffect);
      overlay.style.display = "none";
    }
  }, 50);
};

dropdown.addEventListener("click", () => {
  if (dropdownContent.style.display === "block") {
    dropdownContent.style.display = "none";
    drop_icon1.style.display = "inline-flex";
    drop_icon2.style.display = "none";
  } else {
    dropdownContent.style.display = "block";
    drop_icon1.style.display = "none";
    drop_icon2.style.display = "inline-flex";
  }
});

window.onload = initMap;