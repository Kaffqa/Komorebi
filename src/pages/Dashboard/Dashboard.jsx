import { MoodInputWidget } from "../../components/widgets/MoodInputWidget";
import { MoodSummaryWidget } from "../../components/widgets/MoodSummaryWidget";
import { AssessmentHistoryWidget } from "../../components/widgets/AssessmentHistoryWidget";
import { ActivitySuggestionWidget } from "../../components/widgets/ActivitySuggestionWidget";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        <div className="lg:col-span-3">
          <MoodInputWidget />
        </div>
        <div className="lg:col-span-2">
          <MoodSummaryWidget />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        <div className="lg:col-span-3">
          <AssessmentHistoryWidget />
        </div>
        <div className="lg:col-span-2">
          <ActivitySuggestionWidget />
        </div>
      </motion.div>
    </div>
  );
}
