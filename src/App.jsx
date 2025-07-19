import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

// Supabase config
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function App() {
  const [columns, setColumns] = useState([]);
  const [boardId, setBoardId] = useState(null);

  // COLUMN FUNCTIONS
  const addColumn = () => {
    setColumns([...columns, { id: uuidv4(), name: "New Category", tasks: [] }]);
  };

  const updateColumnName = (id, newName) => {
    setColumns(columns.map(col => col.id === id ? { ...col, name: newName } : col));
  };

  const deleteColumn = (id) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  // TASK FUNCTIONS
  const addTask = (columnId) => {
    const task = { id: uuidv4(), name: "New Task" };
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
    ));
  };

  const deleteTask = (columnId, taskId) => {
    setColumns(columns.map(col =>
      col.id === columnId ? {
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId)
      } : col
    ));
  };

  const renameTask = (columnId, taskId, newName) => {
    setColumns(columns.map(col =>
      col.id === columnId ? {
        ...col,
        tasks: col.tasks.map(task =>
          task.id === taskId ? { ...task, name: newName } : task
        )
      } : col
    ));
  };

  const onDropTask = (taskId, targetColumnId) => {
    let movedTask;
    const updated = columns.map(col => {
      const remainingTasks = col.tasks.filter(task => {
        if (task.id === taskId) {
          movedTask = task;
          return false;
        }
        return true;
      });
      return { ...col, tasks: remainingTasks };
    }).map(col => {
      if (col.id === targetColumnId && movedTask) {
        return { ...col, tasks: [...col.tasks, movedTask] };
      }
      return col;
    });
    setColumns(updated);
  };

  // SAVE/LOAD FROM SUPABASE
  const saveBoard = async () => {
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const { error } = await supabase
      .from("boards")
      .insert([{ id, data: columns }]);

    if (error) {
      alert("Error saving board.");
    } else {
      setBoardId(id);
      window.history.replaceState(null, "", `?id=${id}`);
    }
  };

  const loadBoard = async () => {
    const id = prompt("Enter 4-digit board ID:");
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      alert("Board not found.");
    } else {
      setColumns(data.data);
      setBoardId(id);
      window.history.replaceState(null, "", `?id=${id}`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      supabase
        .from("boards")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (data) {
            setColumns(data.data);
            setBoardId(id);
          }
        });
    }
  }, []);

  // IMPORT / EXPORT
  const exportBoard = () => {
    const blob = new Blob([JSON.stringify(columns, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kanban_board.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBoard = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          setColumns(data);
        } else {
          alert("Invalid board data.");
        }
      } catch {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <div style={{ marginBottom: 10 }}>
        <button className="add-button" onClick={addColumn}>+ Add Category</button>
        <button className="add-button" onClick={saveBoard}>💾 Save</button>
        <button className="add-button" onClick={loadBoard}>📂 Load</button>
        <button className="add-button" onClick={exportBoard}>⬇ Export</button>
        <label className="add-button">
          ⬆ Import
          <input type="file" accept=".json" style={{ display: "none" }} onChange={importBoard} />
        </label>
        {boardId && <span style={{ marginLeft: 10 }}>Board ID: {boardId}</span>}
      </div>

      <div className="board">
        {columns.map(col => (
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
  id, name, tasks, updateName, deleteColumn,
  addTask, deleteTask, renameTask, onDropTask
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleBlur = () => {
    updateName(id, tempName);
    setIsEditing(false);
  };

  return (
    <div
      className="column"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        const taskId = e.dataTransfer.getData("text/plain");
        onDropTask(taskId, id);
      }}
    >
      <div className="column-header">
        {isEditing ? (
          <input
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <h2 onClick={() => setIsEditing(true)}>{name}</h2>
        )}
        <button className="delete-button" onClick={() => deleteColumn(id)}>×</button>
      </div>
      <button className="add-task" onClick={() => addTask(id)}>+ Add Task</button>
      <div className="task-list">
        {tasks.map(task => (
          <Task
            key={task.id}
            task={task}
            columnId={id}
            deleteTask={deleteTask}
            renameTask={renameTask}
          />
        ))}
      </div>
    </div>
  );
}

function Task({ task, columnId, deleteTask, renameTask }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(task.name);

  const handleBlur = () => {
    renameTask(columnId, task.id, tempName);
    setIsEditing(false);
  };

  return (
    <div
      className="task"
      draggable
      onDragStart={e => e.dataTransfer.setData("text/plain", task.id)}
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <span>{task.name}</span>
      )}
      <button className="delete-button" onClick={() => deleteTask(columnId, task.id)}>×</button>
    </div>
  );
}

export default App;
