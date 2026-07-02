import { HiOutlineMail } from "react-icons/hi";
import { LiaWeixin } from "react-icons/lia";
import { LuGithub } from "react-icons/lu";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative flex h-fit flex-col items-center bg-slate-800"
    >
      <div className="relative z-10 flex h-fit w-fit gap-3 bg-slate-800 p-6 text-slate-400">
        <a
          className="duration-200 hover:text-email"
          href="mailto:frederick.ah88@gmail.com"
          target="_blank"
          rel="noreferrer"
        >
          <HiOutlineMail size={46} />
        </a>
        <a
          className="duration-200 hover:text-github"
          href="https://github.com/FrederickAurelio"
          target="_blank"
          rel="noreferrer"
        >
          <LuGithub size={46} />
        </a>
        <LiaWeixin
          className="peer cursor-pointer duration-200 hover:text-weixin"
          size={46}
        />
        <img
          className="absolute -right-8 -top-36 hidden h-40 w-40 duration-200 peer-hover:block"
          src="/wechat.jpg"
          alt="QR Code"
        />
      </div>
      <div className="absolute top-12 w-full border-b-2 border-slate-400"></div>
      <img
        className="h-32 w-32 rounded-full object-cover"
        src="/avatar.jpg"
        alt="avatar"
      />
      <p className="mt-4 flex h-full w-full items-end justify-center p-2 text-sm text-slate-400 md:text-base">
        Copyright &copy; 2024 Frederick Aurelio Halim
      </p>
    </footer>
  );
}
