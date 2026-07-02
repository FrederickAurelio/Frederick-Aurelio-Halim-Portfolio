import { HiMiniArrowUpCircle } from "react-icons/hi2";

export default function ScrollToTopButton() {
  return (
    <a
      href="#hero"
      className="fixed bottom-0 right-0 z-10 m-5 cursor-pointer rounded-full text-sky-500 drop-shadow-lg"
    >
      <HiMiniArrowUpCircle size={50} />
    </a>
  );
}
