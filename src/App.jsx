import React, { useState, useEffect } from 'react';
import { 
  Target,
  Plus, 
  Search, 
  Layers, 
  Clock, 
  CheckSquare,
  RotateCcw,
  Square,
  CheckCircle2,
  Edit3, 
  Trash2, 
  X, 
  Sun, 
  Moon, 
  CircleDot,
  Settings,
  ArrowLeft
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:5000/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" or "settings"

  // Controls & Filters: All, Not Started, In Progress, Stopped
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [sortBy, setSortBy] = useState("recent"); 

  // Theme State: 'night', 'day', 'system'
  const [theme, setTheme] = useState(() => localStorage.getItem("taskbuddy_theme") || "night");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("not started");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ----------------------------------------------------
  // Theme Management (Night, Day, System)
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem("taskbuddy_theme", theme);
    
    const applyTheme = (t) => {
      if (t === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "night" : "day");
      } else {
        document.documentElement.setAttribute("data-theme", t);
      }
    };

    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // ----------------------------------------------------
  // API Calls
  // ----------------------------------------------------
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Open Create / Edit Modal
  const openCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDesc("");
    setPriority("medium");
    setStatus("not started");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDesc(task.description || "");
    setPriority(task.priority || "medium");
    setStatus(task.status || "not started");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Save Task (POST or PUT)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        title: title.trim(),
        description: desc.trim(),
        priority: priority,
        status: status,
        completed: status === "completed"
      };

      if (editingTask) {
        const res = await fetch(`${API_BASE}/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setTasks(prev => prev.map(t => t.id === editingTask.id ? data.task : t));
          setIsModalOpen(false);
        } else {
          setErrorMsg(data.error || "Failed to update task");
        }
      } else {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setTasks(prev => [data.task, ...prev]);
          setIsModalOpen(false);
        } else {
          setErrorMsg(data.error || "Failed to create task");
        }
      }
    } catch (err) {
      setErrorMsg("Network error connecting to backend");
    } finally {
      setSubmitting(false);
    }
  };

  // Set Task Status Directly (Restart, Stop, Complete)
  const setTaskStatus = async (task, newStatus) => {
    const isCompleted = newStatus === "completed";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed: isCompleted } : t));

    try {
      await fetch(`${API_BASE}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, completed: isCompleted })
      });
    } catch (err) {
      fetchTasks();
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    } catch (err) {
      fetchTasks();
    }
  };

  // Helper formatting
  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "";
    }
  };

  // ----------------------------------------------------
  // Counts & Filtering
  // ----------------------------------------------------
  const totalTasks = tasks.length;
  // Active = In Progress
  const activeCount = tasks.filter(t => t.status === "in progress" || t.status === "started").length;
  // Completed = Completed
  const completedCount = tasks.filter(t => t.status === "completed" || t.completed).length;
  
  // Specific filter counts for the 4 filter tabs
  const notStartedCount = tasks.filter(t => (t.status || "not started") === "not started").length;
  const inProgressCount = tasks.filter(t => t.status === "in progress").length;
  const stoppedCount = tasks.filter(t => t.status === "stopped").length;

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      const currentStatus = task.status || "not started";
      if (statusFilter === "not started") return currentStatus === "not started";
      if (statusFilter === "in progress") return currentStatus === "in progress";
      if (statusFilter === "stopped") return currentStatus === "stopped";
      return true; // "all"
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        return (priorityRank[b.priority] || 2) - (priorityRank[a.priority] || 2);
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "older") {
        return (new Date(a.created_at || 0)) - (new Date(b.created_at || 0));
      }
      return (new Date(b.created_at || 0)) - (new Date(a.created_at || 0));
    });

  return (
    <div className="app-container">
      {/* Navbar with Task Buddy, Avatar & Settings */}
      <nav className="navbar">
        <div className="brand-section">
          <div className="brand-icon">
            <Target size={24} />
          </div>
          <div>
            <h1 className="brand-title">Task Buddy</h1>
          </div>
        </div>

        {/* Avatar Greeting Badge */}
        <div className="user-greeting">
          <div className="avatar-circle">K</div>
          <span className="greeting-text">Hi, welcome back!</span>
        </div>

        <div className="nav-actions">
          {currentView === "dashboard" ? (
            <>
              <button className="btn-primary" onClick={openCreateModal}>
                <Plus size={18} />
                <span>Add Task</span>
              </button>

              <button 
                className="nav-icon-btn" 
                title="Settings & Themes"
                onClick={() => setCurrentView("settings")}
              >
                <Settings size={20} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setCurrentView("dashboard")}>
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </nav>

      {/* ====================================================
          VIEW 1: SETTINGS PAGE
         ==================================================== */}
      {currentView === "settings" ? (
        <div className="settings-container">
          <h2 className="settings-title">App Settings & Appearance</h2>
          <p className="settings-desc">Choose your preferred visual theme across Task Buddy.</p>

          <div className="theme-options-grid">
            <div 
              className={`theme-card ${theme === "day" ? "active" : ""}`}
              onClick={() => setTheme("day")}
            >
              <div className="theme-card-icon" style={{ color: "#f59e0b" }}>
                <Sun size={28} />
              </div>
              <div className="theme-card-label">Day Mode</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                Clean, crisp light theme with elevated clarity.
              </p>
            </div>

            <div 
              className={`theme-card ${theme === "night" ? "active" : ""}`}
              onClick={() => setTheme("night")}
            >
              <div className="theme-card-icon" style={{ color: "#a855f7" }}>
                <Moon size={28} />
              </div>
              <div className="theme-card-label">Night Mode</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                Deep, modern glassmorphic dark theme.
              </p>
            </div>

            <div 
              className={`theme-card ${theme === "system" ? "active" : ""}`}
              onClick={() => setTheme("system")}
            >
              <div className="theme-card-icon" style={{ color: "#3b82f6" }}>
                <CircleDot size={28} />
              </div>
              <div className="theme-card-label">System Theme</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                Syncs automatically with your OS preference.
              </p>
            </div>
          </div>

          
        </div>
      ) : (

      /* ====================================================
          VIEW 2: TASKS DASHBOARD
         ==================================================== */
        <>
          {/* Exact 3 Boxes: Total Tasks, Active, Completed */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
                <Layers size={24} />
              </div>
              <div>
                <div className="stat-num">{totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                <Clock size={24} />
              </div>
              <div>
                <div className="stat-num">{activeCount}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <div className="stat-num">{completedCount}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search, 4 Sorts, and 4 Filter Tabs (All, Not Started, In Progress, Stopped) */}
          <div className="controls-bar">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search tasks by title or details..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="controls-right">
              {/* 4 Sorting Options */}
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Sort tasks"
              >
                <option value="recent">Sort: Recent (Newest)</option>
                <option value="older">Sort: Older (Oldest)</option>
                <option value="priority">Sort: By Priority</option>
                <option value="alphabetical">Sort: A – Z</option>
              </select>

              {/* Exact 4 Filter Tabs with counts beside Sort */}
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${statusFilter === "all" ? "active" : ""}`} 
                  onClick={() => setStatusFilter("all")}
                >
                  All ({totalTasks})
                </button>
                <button 
                  className={`filter-tab ${statusFilter === "not started" ? "active" : ""}`} 
                  onClick={() => setStatusFilter("not started")}
                >
                  Not Started ({notStartedCount})
                </button>
                <button 
                  className={`filter-tab ${statusFilter === "in progress" ? "active" : ""}`} 
                  onClick={() => setStatusFilter("in progress")}
                >
                  In Progress ({inProgressCount})
                </button>
                <button 
                  className={`filter-tab ${statusFilter === "stopped" ? "active" : ""}`} 
                  onClick={() => setStatusFilter("stopped")}
                >
                  Stopped ({stoppedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="tasks-grid">
            {loading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <div className="empty-state">
                <Target size={44} className="empty-icon" />
                <h3>No tasks found</h3>
                <p style={{ color: "var(--text-dim)", marginTop: "6px" }}>
                  {search ? "No tasks match your search or filter." : "Click Add Task to get started!"}
                </p>
              </div>
            ) : (
              filteredAndSortedTasks.map(task => {
                const currentStatus = task.status || "not started";
                const currentPriority = task.priority || "medium";
                const statusClass = currentStatus.replace(" ", "-");

                return (
                  <div key={task.id} className="task-card">
                    <div>
                      <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                      </div>
                      {task.description && <p className="task-desc">{task.description}</p>}
                    </div>

                    <div>
                      {/* Priority and Status Badges (Static - cycling removed) */}
                      <div className="task-badges">
                        <span className={`badge priority-${currentPriority}`}>
                          {currentPriority}
                        </span>

                        <span className={`status-badge status-${statusClass}`}>
                          {currentStatus}
                        </span>
                      </div>

                      {/* Footer with Timestamp and 5 Round Colored Action Icons */}
                      <div className="task-footer">
                        {/* Timestamp tracking */}
                        <div className="task-timestamp">
                          {task.updated_at ? (
                            <span>Edited {formatTime(task.updated_at)}</span>
                          ) : task.created_at ? (
                            <span>Created {formatTime(task.created_at)}</span>
                          ) : null}
                        </div>

                        {/* Round Icon Buttons: Restart, Stop, Complete, Edit, Delete */}
                        <div className="task-actions">
                          {/* 1. Restart Icon (Cyan) */}
                          <button 
                            className="action-btn restart-btn" 
                            title="Restart Task"
                            onClick={() => setTaskStatus(task, "in progress")}
                          >
                            <RotateCcw size={15} />
                          </button>

                          {/* 2. Stop Icon (Amber) */}
                          <button 
                            className="action-btn stop-btn" 
                            title="Stop Task"
                            onClick={() => setTaskStatus(task, "stopped")}
                          >
                            <Square size={14} />
                          </button>

                          {/* 3. Complete Icon (Emerald) */}
                          <button 
                            className="action-btn complete-btn" 
                            title="Complete Task"
                            onClick={() => setTaskStatus(task, "completed")}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          {/* 4. Edit Icon (Purple) */}
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit Task"
                            onClick={() => openEditModal(task)}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* 5. Delete Icon (Rose) */}
                          <button 
                            className="action-btn delete-btn" 
                            title="Delete Task"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ====================================================
          MODAL: ADD OR EDIT TASK
         ==================================================== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? "Edit Task" : "Add Task"}
              </h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ color: "#f43f5e", marginBottom: "16px", fontSize: "0.9rem" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Design Landing Page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Add notes, specifications, or details..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              {/* Priority Dropdown */}
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="form-group">
                <label className="form-label">Progress Status</label>
                <select 
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="stopped">Stopped</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : (editingTask ? "Update Task" : "Add Task")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
