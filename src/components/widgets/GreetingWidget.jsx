import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuthStore } from "../../stores/useAuthStore";
import { cn } from "../../utils/cn";

export function GreetingWidget() {
  const { profile } = useAuthStore();
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Selamat Pagi");
    else if (hour >= 12 && hour < 15) setGreeting("Selamat Siang");
    else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    setCurrentDate(format(new Date(), "EEEE, d MMMM yyyy", { locale: id }));
  }, []);

  return (
    <div className="glass-card p-6 flex flex-col justify-center min-h-[140px] bg-gradient-to-br from-komorebi-green/10 to-transparent">
      <h2 className="text-2xl md:text-3xl font-heading text-komorebi-green mb-2">
        {greeting}, {profile?.display_name?.split(' ')[0] || "Teman"}!
      </h2>
      <p className="text-komorebi-dark/70 font-medium">{currentDate}</p>
    </div>
  );
}
