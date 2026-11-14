const gallery = document.querySelector(".photos");

if (gallery) {
  const activate = (slide, focus = false) => {
    gallery.querySelectorAll(".gallery-slide").forEach((item) => {
      item.classList.toggle("is-active", item === slide);
    });
    if (focus) slide.focus({ preventScroll: true });
  };

  const initialSlide = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (initialSlide?.classList.contains("gallery-slide")) activate(initialSlide);

  document.addEventListener("click", (event) => {
    const viewerArrow = event.target.closest(".photo-viewer-arrow[popovertarget]");
    if (viewerArrow) {
      const currentViewer = viewerArrow.closest(".photo-viewer");
      const nextViewer = document.getElementById(viewerArrow.getAttribute("popovertarget"));
      if (!currentViewer?.matches(":popover-open") || !nextViewer) return;

      event.preventDefault();
      currentViewer.hidePopover();
      nextViewer.showPopover();
      return;
    }

    const link = event.target.closest('.gallery-arrow[href^="#photo-"]');
    if (!link) return;

    const nextSlide = document.querySelector(link.hash);
    if (!nextSlide || !gallery.contains(nextSlide)) return;

    event.preventDefault();
    const { scrollX, scrollY } = window;
    history.pushState(null, "", link.hash);
    activate(nextSlide, true);
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo(scrollX, scrollY);
    }
  });

  window.addEventListener("popstate", () => {
    const slide = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    activate(slide?.classList.contains("gallery-slide") ? slide : gallery.querySelector(".gallery-slide"));
  });
}
