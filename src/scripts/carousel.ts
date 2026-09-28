import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

const carouselElements = document.querySelectorAll<HTMLElement>('.js-carousel');

carouselElements.forEach((carousel) => {
  const carouselView = carousel.querySelector<HTMLElement>('.js-carouselView');

  if (!carouselView) {
    return;
  }

  const embla = EmblaCarousel(
    carouselView,
    {
      loop: true,
    },
    [Autoplay()],
  );

  const prev = carousel.querySelector<HTMLButtonElement>('.btn-prev');
  const next = carousel.querySelector<HTMLButtonElement>('.btn-next');

  prev?.addEventListener('click', () => {
    embla.scrollPrev();
  });

  next?.addEventListener('click', () => {
    embla.scrollNext();
  });

  embla.plugins().autoplay?.play();
});
