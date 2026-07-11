import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-gray-200/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-blue-600"
        >
          <Cloud size={34} />
          CloudVault
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="rounded-xl px-5 py-2 font-semibold transition hover:bg-gray-100"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;