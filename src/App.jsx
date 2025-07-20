import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./styles.css";

function App() {
  const [columns, setColumns] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      loadBoardById(id);
    }
  }, []);

  const saveBoard = async () => {
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(columns),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      const id = data.id;
      const url = window.location.origin + window.location.pathname + "?id=" + id;
      alert(`Board saved!\nYour URL: ${url}\nYour ID: ${id}`);
      window.history.pushState(null, "", "?id=" + id);
    } catch (e) {
      alert("Failed to save board: " + e.message);
    }
  };

    const loadBoardById = async (id) => {
    try {
        const res = await fetch(`/api/load?id=${id}`);
        if (!res.ok) throw new Error("Board not found");

        const json = await res.json();
        const loadedColumns = json.data;

        if (!Array.isArray(loadedColumns)) {
        throw new Error("Loaded data is not an array");
        }

        console.log("Loaded board data:", loadedColumns);
        setColumns(loadedColumns);
    } catch (e) {
        alert("Failed to load board: " + e.message);
    }
    };


  const loadBoard = () => {
    const id = prompt("Enter your 4-digit board ID:");
    if (id && /^\d{4}$/.test(id)) {
      window.location.href = window.location.origin + window.location.pathname + "?id=" + id;
    } else {
      alert("Invalid ID format. Must be 4 digits.");
    }
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: uuidv4(),
        name: "New Category",
        tasks: [],
      },
    ]);
  };

  const updateColumnName = (id, newName) => {
    setColumns(
      columns.map((col) => (col.id === id ? { ...col, name: newName } : col))
    );
  };

  const deleteColumn = (id) => {
    setColumns(columns.filter((col) => col.id !== id));
  };

  const addTask = (columnId) => {
    const task = { id: uuidv4(), name: "New Task" };
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
      )
    );
  };

  const deleteTask = (columnId, taskId) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((task) => task.id !== taskId) }
          : col
      )
    );
  };

  const renameTask = (columnId, taskId, newName) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === taskId ? { ...task, name: newName } : task
              ),
            }
          : col
      )
    );
  };

  const onDropTask = (taskId, targetColumnId) => {
    let movedTask;
    const updated = columns
      .map((col) => {
        const remainingTasks = col.tasks.filter((task) => {
          if (task.id === taskId) {
            movedTask = task;
            return false;
          }
          return true;
        });
        return { ...col, tasks: remainingTasks };
      })
      .map((col) => {
        if (col.id === targetColumnId && movedTask) {
          return { ...col, tasks: [...col.tasks, movedTask] };
        }
        return col;
      });
    setColumns(updated);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(columns, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "board-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedColumns = JSON.parse(evt.target.result);
        if (Array.isArray(importedColumns)) {
          setColumns(importedColumns);
        } else {
          alert("Invalid file format.");
        }
      } catch {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="app">
      <div style={{ marginBottom: 10 }}>
        <button className="add-button" onClick={addColumn}>
          + Add Category
        </button>
        <button className="add-button" onClick={exportData} style={{ marginLeft: 10 }}>
          Export
        </button>
        <button
          className="add-button"
          onClick={() => fileInputRef.current.click()}
          style={{ marginLeft: 10 }}
        >
          Import
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={importData}
        />
        <button className="add-button" onClick={saveBoard} style={{ marginLeft: 10 }}>
          Save
        </button>
        <button className="add-button" onClick={loadBoard} style={{ marginLeft: 10 }}>
          Load
        </button>
      </div>

      <div className="board">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            name={col.name}
            tasks={col.tasks}
            updateName={updateColumnName}
            deleteColumn={deleteColumn}
            addTask={addTask}
            deleteTask={deleteTask}
            renameTask={renameTask}
            onDropTask={onDropTask}
          />
        ))}
      </div>
    </div>
  );
}

function Column({
  id,
  name,
  tasks,
  updateName,
  deleteColumn,
  addTask,
  deleteTask,
  renameTask,
  onDropTask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [tempTaskName, setTempTaskName] = useState("");

  useEffect(() => {
    setTempName(name);
  }, [name]);

  const handleBlur = () => {
    updateName(id, tempName);
    setIsEditing(false);
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setTempTaskName(task.name);
  };

  const finishEditingTask = () => {
    if (tempTaskName.trim()) {
      renameTask(id, editingTaskId, tempTaskName.trim());
    }
    setEditingTaskId(null);
    setTempTaskName("");
  };

  return (
    <div
      className="column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const taskId = e.dataTransfer.getData("text/plain");
        onDropTask(taskId, id);
      }}
    >
      <div className="column-header">
        {isEditing ? (
          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <h2 onClick={() => setIsEditing(true)}>{name}</h2>
        )}
        <button className="delete-button" onClick={() => deleteColumn(id)}>
          ×
        </button>
      </div>

      <button className="add-button" onClick={() => addTask(id)}>
        + Add Task
      </button>

      <div className="tasks">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="task"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
          >
            {editingTaskId === task.id ? (
              <input
                value={tempTaskName}
                onChange={(e) => setTempTaskName(e.target.value)}
                onBlur={finishEditingTask}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditingTask();
                  if (e.key === "Escape") setEditingTaskId(null);
                }}
                autoFocus
              />
            ) : (
              <span onDoubleClick={() => startEditingTask(task)}>{task.name}</span>
            )}

            <button
              className="delete-button"
              onClick={() => deleteTask(id, task.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
