const gallery = document.querySelector(".photos");

function enableSwipe(section, gallery, selectSlide) {
  const slides = [...gallery.querySelectorAll(".gallery-slide")];
  if (slides.length < 2) return;

  const picker = document.createElement("select");
  picker.className = "gallery-picker";
  picker.setAttribute("aria-label", "Обрати фото");
  slides.forEach((slide, index) => {
    picker.add(new Option(`${index + 1} / ${slides.length}`, slide.id));
  });
  gallery.after(picker);

  const syncPicker = () => {
    picker.value = gallery.querySelector(".is-active").id;
  };
  picker.addEventListener("change", () => selectSlide(document.getElementById(picker.value)));
  syncPicker();
  section.classList.add("swipe-ready");

  const move = (surface, forward) => {
    const position = forward ? 2 : 1;
    const selector = surface.matches(".photo-viewer")
      ? `.photo-viewer-arrow:nth-child(${position}):enabled`
      : `a.gallery-arrow:nth-child(${position})`;
    surface.querySelector(selector)?.click();
  };

  let start = null;
  let suppressTap = false;
  section.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    start = null;
    suppressTap = false;
    const surface = event.target.closest(".gallery-media, .photo-viewer");
    if (event.isPrimary && surface && !event.target.closest(".photo-close")) {
      start = { id: event.pointerId, x: event.clientX, y: event.clientY, surface };
    }
  });
  section.addEventListener("pointercancel", () => { start = null; });
  section.addEventListener("pointerup", (event) => {
    if (start?.id !== event.pointerId) return;
    const { x, y, surface } = start;
    start = null;
    const deltaX = event.clientX - x;
    const deltaY = event.clientY - y;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    suppressTap = true;
    move(surface, deltaX < 0);
  });
  section.addEventListener("click", (event) => {
    if (!suppressTap || event.detail === 0) return;
    suppressTap = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  section.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const surface = event.target.closest(".photo-viewer")
      ?? event.target.closest(".photos")?.querySelector(".is-active .gallery-media");
    if (!surface) return;
    event.preventDefault();
    move(surface, event.key === "ArrowRight");
  });

  return syncPicker;
}

if (gallery) {
  let syncPicker;
  const activate = (slide, focus = false) => {
    gallery.querySelectorAll(".gallery-slide").forEach((item) => {
      item.classList.toggle("is-active", item === slide);
    });
    if (focus) slide.focus({ preventScroll: true });
    syncPicker?.();
  };

  const selectSlide = (slide, focus = false) => {
    if (!slide || !gallery.contains(slide)) return;
    const { scrollX, scrollY } = window;
    history.pushState(null, "", `#${slide.id}`);
    activate(slide, focus);
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo(scrollX, scrollY);
    }
  };

  const initialSlide = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (initialSlide?.classList.contains("gallery-slide")) activate(initialSlide);

  const swipeSection = gallery.closest("[data-swipe]");
  if (swipeSection) syncPicker = enableSwipe(swipeSection, gallery, selectSlide);

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
    selectSlide(nextSlide, true);
  });

  window.addEventListener("popstate", () => {
    const slide = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    activate(slide?.classList.contains("gallery-slide") ? slide : gallery.querySelector(".gallery-slide"));
  });
}
