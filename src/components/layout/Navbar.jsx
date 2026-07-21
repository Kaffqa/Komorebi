import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import Logo from "../../assets/logo.svg";

export function Navbar({ onOpenAuth }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("/");
  const location = useLocation();

  useEffect(() => {
    const sectionIds = ["stories", "how-it-works", "expert", "faq", "testimonials"];

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Track active section on scroll
      const scrollPosition = window.scrollY + 250;
      let current = "/";

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = `/#${id}`;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
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
          {navLinks.map((link) => {
            const isActive = activeSection === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => {
                  setActiveSection(link.path);
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
                className={cn(
                  "text-[15px] font-body transition-all duration-200 tracking-wide",
                  isActive
                    ? "font-medium text-white"
                    : "font-light text-white/75 hover:text-white"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center">
          <Button
            onClick={onOpenAuth}
            className="bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white font-body font-light px-6 py-2 rounded-full transition-all duration-300 text-[15px]"
          >
            Get Started
          </Button>
        </div>
      </nav>
      </div>
    </div>
  );
}
