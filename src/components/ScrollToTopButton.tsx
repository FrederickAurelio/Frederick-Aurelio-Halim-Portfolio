import { HiMiniArrowUpCircle } from "react-icons/hi2";

export default function ScrollToTopButton() {
  return (
    <a
      href="#hero"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-10 flex size-14 cursor-pointer items-center justify-center rounded-full text-sky-500 drop-shadow-lg"
    >
      <HiMiniArrowUpCircle size={44} />
    </a>
  );
}
