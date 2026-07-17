import { Link } from "react-router";
import { Brain, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

export function ExpertResultWidget({ latestResult = null }) {
  if (!latestResult) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="h-12 w-12 rounded-full bg-komorebi-light flex items-center justify-center text-komorebi-green mb-4">
          <Brain className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-komorebi-dark mb-2">
          Belum Ada Hasil Tes
        </h3>
        <p className="text-sm text-komorebi-dark/70 mb-4 max-w-[250px]">
          Lakukan asesmen psikologi pertama kamu untuk mengetahui kondisi mentalmu saat ini.
        </p>
        <Button to="/expert" variant="primary" size="sm" className="rounded-full w-full max-w-[200px]">
          Mulai Asesmen
        </Button>
      </div>
    );
  }

  // Jika ada hasil
  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-komorebi-dark/70 mb-1">Hasil Asesmen Terakhir</h3>
          <p className="text-xl font-semibold text-komorebi-dark">{latestResult.assessment_name}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${latestResult.theme_color}-100 text-${latestResult.theme_color}-700`}>
          {latestResult.severity_level}
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-komorebi-green">{latestResult.percentage}%</span>
          <span className="text-sm text-komorebi-dark/50">Tingkat Indikasi</span>
        </div>
        <div className="w-full bg-komorebi-light rounded-full h-2 mb-4">
          <div 
            className="bg-komorebi-green h-2 rounded-full" 
            style={{ width: `${latestResult.percentage}%` }}
          />
        </div>
        
        <Link 
          to={`/expert/result/${latestResult.id}`}
          className="inline-flex items-center text-sm font-medium text-komorebi-green hover:text-komorebi-green-light transition-colors"
        >
          Lihat Detail <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
