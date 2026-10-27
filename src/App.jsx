import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Sparkles, 
  Layers, 
  CheckSquare, 
  Clock, 
  X, 
  AlertCircle 
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:5000/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = create mode, task object = edit mode

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Fetch tasks
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

  // 2. Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDesc("");
    setPriority("medium");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDesc(task.description || "");
    setPriority(task.priority || "medium");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // 3. Save (Create or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      if (editingTask) {
        // UPDATE (PUT)
        const res = await fetch(`${API_BASE}/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: desc.trim(),
            priority: priority
          })
        });

        const data = await res.json();
        if (res.ok) {
          setTasks(prev => prev.map(t => t.id === editingTask.id ? data.task : t));
          setIsModalOpen(false);
        } else {
          setErrorMsg(data.error || "Failed to update task");
        }
      } else {
        // CREATE (POST)
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: desc.trim(),
            priority: priority,
            completed: false
          })
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

  // 4. Toggle Complete
  const toggleComplete = async (task) => {
    const updatedStatus = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updatedStatus } : t));

    try {
      await fetch(`${API_BASE}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: updatedStatus })
      });
    } catch (err) {
      fetchTasks();
    }
  };

  // 5. Delete Task
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    } catch (err) {
      fetchTasks();
    }
  };

  // Format timestamp helper
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    if (filter === "completed") return task.completed;
    if (filter === "active") return !task.completed;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const highPriorityCount = tasks.filter(t => t.priority === "high" && !t.completed).length;

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand-section">
          <div className="brand-icon">
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <h1 className="brand-title">TaskFlow OS</h1>
            <div className="brand-subtitle">
              <span className="status-dot"></span>
              Flask & Cloud Firestore Connected
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </nav>

      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <Layers size={26} />
          </div>
          <div>
            <div className="stat-num">{totalCount}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <CheckSquare size={26} />
          </div>
          <div>
            <div className="stat-num">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-num">{pendingCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185" }}>
            <AlertCircle size={26} />
          </div>
          <div>
            <div className="stat-num">{highPriorityCount}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="controls-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            All ({totalCount})
          </button>
          <button className={`filter-tab ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>
            Active ({pendingCount})
          </button>
          <button className={`filter-tab ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
            Done ({completedCount})
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="tasks-grid">
        {loading ? (
          <div className="empty-state">
            <p>Loading your Cloud Firestore tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Layers size={40} className="empty-icon" />
            <h3>No tasks found</h3>
            <p style={{ color: "#64748b", marginTop: "6px" }}>
              {search ? "No tasks match your search criteria." : "Create your first task to get started!"}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`task-card ${task.completed ? "completed" : ""}`}>
              <div>
                <div className="task-header">
                  <button className="toggle-btn" onClick={() => toggleComplete(task)}>
                    {task.completed ? <CheckCircle2 size={22} color="#10b981" /> : <Circle size={22} />}
                  </button>
                  <h3 className="task-title">{task.title}</h3>
                </div>
                {task.description && <p className="task-desc">{task.description}</p>}
              </div>

              <div>
                {/* Timestamp tracking display */}
                <div className="task-timestamp">
                  {task.updated_at ? (
                    <span>Edited {formatTime(task.updated_at)}</span>
                  ) : task.created_at ? (
                    <span>Created {formatTime(task.created_at)}</span>
                  ) : null}
                </div>

                <div className="task-footer">
                  <span className={`priority-badge priority-${task.priority || "medium"}`}>
                    {task.priority || "medium"}
                  </span>

                  <div className="task-actions">
                    <button 
                      className="action-btn edit-btn" 
                      title="Edit task"
                      onClick={() => openEditModal(task)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      title="Delete task"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? "Edit Task" : "Create New Task"}
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
                  placeholder="e.g. Implement User Authentication"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Add details, notes or acceptance criteria..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : (editingTask ? "Update Task" : "Create Task")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
