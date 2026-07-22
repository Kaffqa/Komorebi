import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  BarChart3, 
  Settings2, 
  Plus,
  Trash2,
  Save,
  Pencil
} from "lucide-react";

const SEVERITY_COLORS = {
  'Normal': '#5D8B66',
  'Mild': '#94B59F',
  'Moderate': '#F59E0B',
  'Severe': '#EF4444',
  'Extremely Severe': '#991B1B'
};

export default function AssessmentAnalytics() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // New question form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ text: "", subscale: "depression" });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAssessmentId) {
      const selected = assessments.find(a => a.id === selectedAssessmentId);
      if (selected) {
        setQuestions(selected.questions || []);
      }
    }
  }, [selectedAssessmentId, assessments]);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch analytics
      const { data: statsData } = await supabase.rpc('get_assessment_analytics');
      setStats(statsData);

      // Fetch assessments for editor
      const { data: assessmentData } = await supabase.from('assessments').select('*');
      setAssessments(assessmentData || []);
      if (assessmentData && assessmentData.length > 0) {
        setSelectedAssessmentId(assessmentData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    setIsEditing(true);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) return;
    
    // Auto-generate new ID based on max ID
    const maxId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) : 0;
    
    setQuestions([
      ...questions, 
      { id: maxId + 1, text: newQuestion.text, subscale: newQuestion.subscale }
    ]);
    
    setNewQuestion({ text: "", subscale: "depression" });
    setShowAddForm(false);
    setIsEditing(true);
  };

  const handleSaveQuestions = async () => {
    if (!selectedAssessmentId) return;
    
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ questions: questions })
        .eq('id', selectedAssessmentId);
        
      if (error) throw error;
      
      alert("Questions saved successfully!");
      setIsEditing(false);
      
      // Update local assessments array
      setAssessments(assessments.map(a => 
        a.id === selectedAssessmentId ? { ...a, questions } : a
      ));
    } catch (error) {
      console.error("Error saving questions:", error);
      alert("Failed to save questions");
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 font-sans">Assessment Analytics</h2>
          <p className="text-[14px] text-gray-500 font-sans mt-1">Insights & Question Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`relative px-5 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wider font-sans transition-colors flex items-center gap-2 ${
            activeTab === "analytics" ? "text-[#5D8B66]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {activeTab === "analytics" && (
            <motion.div layoutId="assessmentTab" className="absolute inset-0 bg-white shadow-sm rounded-xl" />
          )}
          <span className="relative z-10 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab("editor")}
          className={`relative px-5 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wider font-sans transition-colors flex items-center gap-2 ${
            activeTab === "editor" ? "text-[#5D8B66]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {activeTab === "editor" && (
            <motion.div layoutId="assessmentTab" className="absolute inset-0 bg-white shadow-sm rounded-xl" />
          )}
          <span className="relative z-10 flex items-center gap-2"><Settings2 className="w-4 h-4" /> Editor</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans relative z-10">Total Assessments</p>
                <p className="text-[36px] font-black text-gray-900 font-sans tracking-tight relative z-10">{stats?.total || 0}</p>
              </div>
              <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans relative z-10">Most Common Severity</p>
                <p className="text-[28px] font-black text-[#5D8B66] font-sans mt-2 tracking-tight relative z-10">
                  {stats?.severity_distribution?.[0]?.severity_level || "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans relative z-10">Avg Monthly Health</p>
                <p className="text-[36px] font-black text-gray-900 font-sans tracking-tight relative z-10">
                  {stats?.monthly_trend?.[stats.monthly_trend.length - 1]?.avg_percentage || 0}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Severity Distribution</h3>
                <p className="text-[13px] text-gray-500 font-sans mt-1 mb-8">Breakdown of assessment severity levels</p>
                <div className="flex-1 min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.severity_distribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        cornerRadius={10}
                        dataKey="count"
                        nameKey="severity_level"
                        stroke="none"
                      >
                        {stats?.severity_distribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity_level] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#1a1f2e', fontWeight: '900' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {stats?.severity_distribution?.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: SEVERITY_COLORS[entry.severity_level] || '#ccc' }}></div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 font-sans">{entry.severity_level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Chart */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Monthly Assessments Taken</h3>
                <p className="text-[13px] text-gray-500 font-sans mt-1 mb-8">Trend over the last year</p>
                <div className="flex-1 min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.monthly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5D8B66" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#5D8B66" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 20px' }}
                        labelStyle={{ color: '#6b7280', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                        itemStyle={{ color: '#5D8B66', fontWeight: '900', fontSize: '16px' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#5D8B66" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "editor" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="w-full sm:w-auto">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Select Assessment</label>
                <select 
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full sm:w-80 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] font-medium transition-all"
                >
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-[14px] font-bold transition-colors font-sans flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
                {isEditing && (
                  <button
                    onClick={handleSaveQuestions}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-[#5D8B66] hover:bg-[#43674F] text-white rounded-2xl text-[14px] font-bold transition-all font-sans flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="bg-white rounded-[32px] p-8 border border-[#5D8B66]/20 shadow-lg shadow-[#5D8B66]/5 relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#5D8B66] rounded-l-[32px]" />
                    <h3 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight mb-6">Create New Question</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Question Text</label>
                        <input
                          type="text"
                          placeholder="E.g. I found it hard to wind down"
                          value={newQuestion.text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Category</label>
                        <select
                          value={newQuestion.subscale}
                          onChange={(e) => setNewQuestion({ ...newQuestion, subscale: e.target.value })}
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all"
                        >
                          <option value="depression">Depression</option>
                          <option value="anxiety">Anxiety</option>
                          <option value="stress">Stress</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button 
                        onClick={() => setShowAddForm(false)}
                        className="px-6 py-3 rounded-2xl text-[14px] font-bold text-gray-500 hover:bg-gray-100 transition-colors font-sans"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddQuestion}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[14px] font-bold hover:bg-gray-800 transition-all font-sans shadow-lg hover:-translate-y-0.5"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4 px-2">
                <div>
                  <h3 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">
                    Questions List
                  </h3>
                  <p className="text-[13px] text-gray-500 font-sans mt-1">Total {questions.length} questions in this assessment</p>
                </div>
                {isEditing && <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"/> Unsaved Changes</span>}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {questions.map((q, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={q.id} 
                    className="bg-white rounded-[24px] p-5 sm:px-6 flex items-center gap-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center text-[13px] font-black font-sans group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] text-gray-900 font-sans font-medium">{q.text}</p>
                    </div>
                    <div>
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider font-sans shadow-sm ${
                        q.subscale === 'depression' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' :
                        q.subscale === 'anxiety' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' :
                        'bg-red-50 text-red-600 ring-1 ring-red-200'
                      }`}>
                        {q.subscale}
                      </span>
                    </div>
                    <div className="pl-4 border-l border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {questions.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-[32px] border border-gray-100 border-dashed">
                    <p className="text-gray-500 font-sans font-medium text-[15px]">No questions found for this assessment.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
