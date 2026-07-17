import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import Logo from "../../assets/logo.svg";

export function Navbar({ onOpenAuth }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Our Stories", path: "/#stories" },
    { name: "How It Works", path: "/#how-it-works" },
    { name: "Expert Care", path: "/#expert" },
    { name: "FAQ", path: "/#faq" },
    { name: "Testimonials", path: "/#testimonials" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none pt-4">
      <div className="w-full max-w-[1650px] px-4 md:px-8 pointer-events-auto">
        <nav
          className={cn(
            "w-full transition-all duration-300 py-3 px-6 md:px-8 rounded-full flex items-center justify-between",
            isScrolled
              ? "bg-[#43674F]/95 backdrop-blur-md shadow-lg"
              : "bg-[#43674F] shadow-md"
          )}
        >
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="Komorebi Logo" className="h-6 w-auto" />
          <span className="text-white text-xl font-sans font-bold tracking-wide">
            Komorebi
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={(e) => {
                if (location.pathname === "/") {
                  if (link.path.startsWith("/#")) {
                    e.preventDefault();
                    const targetId = link.path.replace("/#", "");
                    const element = document.getElementById(targetId);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                      window.history.pushState(null, "", link.path);
                    }
                  } else if (link.path === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    window.history.pushState(null, "", "/");
                  }
                }
              }}
              className="text-[15px] font-normal transition-colors text-white/80 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center">
          <Button
            onClick={onOpenAuth}
            className="bg-gradient-to-r from-[#5F916F] to-[#94B59F] border border-white/30 shadow-sm text-white hover:brightness-110 font-medium px-6 py-2 rounded-full transition-all duration-300 text-[15px]"
          >
            Get Started
          </Button>
        </div>
      </nav>
      </div>
    </div>
  );
}
