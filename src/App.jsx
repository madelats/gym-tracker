import { useState, useEffect } from "react";

const EXERCISES_BY_GROUP = {
  "Pecho":    ["Press banca", "Press inclinado", "Press declinado", "Aperturas", "Fondos en paralelas", "Crossover"],
  "Hombros":  ["Press militar", "Elevaciones laterales", "Elevaciones frontales", "Pájaros", "Press Arnold"],
  "Espalda":  ["Remo con barra", "Remo con mancuerna", "Dominadas", "Jalón al pecho", "Peso muerto", "Remo en polea"],
  "Piernas":  [
    "Cadera Abductor (🔓)",
    "Cadera Aductor (🔒)",
    "Extensión gemelos (↕️)",
    "Extensión piernas (⬆️)",
    "Femoral sentado (⬇️)",
    "Femoral tumbado",
    "Gluteo",
    "Piernas (Pared delantera)",
    "Sentadilla",
    "Prensa",
    "Extensión de cuádriceps",
    "Curl femoral",
    "Hip thrust",
    "Zancadas", 
    "Peso muerto rumano",
    "Gemelos en máquina"
  ],
  "Bíceps":   ["Curl de bíceps", "Curl martillo", "Curl en polea", "Curl concentrado"],
  "Tríceps":  ["Press francés", "Extensión de tríceps", "Fondos en banco", "Tríceps en polea"],
  "Core":     ["Plancha", "Crunch", "Elevación de piernas", "Rueda abdominal", "Oblicuos"],
  "Cardio":   ["Cinta", "Bicicleta estática", "Elíptica", "Remo ergómetro", "Escaladora"],
};

const ALL_GROUPS = Object.keys(EXERCISES_BY_GROUP);

const GROUP_COLORS = {
  "Pecho":    "#ef4444",
  "Hombros":  "#f97316",
  "Espalda":  "#3b82f6",
  "Piernas":  "#22c55e",
  "Bíceps":   "#a855f7",
  "Tríceps":  "#ec4899",
  "Core":     "#eab308",
  "Cardio":   "#06b6d4",
};

const STORAGE_KEY = "gym-journal-v2";

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(str) {
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

// Returns { date, maxWeight, sets } of the last time the exercise was done before `beforeDate`
function getLastSession(data, exerciseName, beforeDate) {
  const dates = Object.keys(data).filter(d => d < beforeDate).sort((a, b) => b.localeCompare(a));
  for (const date of dates) {
    const ex = data[date].exercises?.find(e => e.name === exerciseName);
    if (ex && ex.sets?.length) {
      const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
      return { date, maxWeight: maxWeight > 0 ? maxWeight : null, sets: ex.sets };
    }
  }
  return null;
}

// Returns array of { date, maxWeight } for charting
function getProgressHistory(data, exerciseName) {
  return Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .map(date => {
      const ex = data[date].exercises?.find(e => e.name === exerciseName);
      if (!ex) return null;
      const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
      const totalReps = ex.sets.reduce((n, s) => n + (parseInt(s.reps) || 0), 0);
      return maxWeight > 0 ? { date, maxWeight, totalReps } : null;
    })
    .filter(Boolean);
}

export default function GymTracker() {
  const [data, setData] = useState({});
  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addTab, setAddTab] = useState("list"); // "list" | "custom"
  const [filterGroup, setFilterGroup] = useState("Pecho");
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Pecho");
  const [notification, setNotification] = useState(null);
  const [progressEx, setProgressEx] = useState(null); // exercise name for chart modal

  useEffect(() => { setData(loadData()); }, []);

  function getSession(date) {
    return data[date] || { exercises: [], notes: "" };
  }
  function updateSession(date, session) {
    const nd = { ...data, [date]: session };
    setData(nd);
    saveData(nd);
  }
  function notify(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1800);
  }

  function addExercise(name, group) {
    const session = getSession(selectedDate);
    if (session.exercises.find(e => e.name === name)) { notify("Ya está en la sesión"); return; }
    const isCardio = group === "Cardio";
    const entry = isCardio
      ? { name, group, sets: [{ minutes: "", km: "" }] }
      : { name, group, sets: [{ weight: "", reps: "" }] };
    updateSession(selectedDate, { ...session, exercises: [...session.exercises, entry] });
    setShowAddExercise(false);
    notify("Añadido ✓");
  }

  function addCustomExercise() {
    if (!customName.trim()) return;
    addExercise(customName.trim(), customGroup);
    setCustomName("");
  }

  function removeExercise(i) {
    const s = getSession(selectedDate);
    updateSession(selectedDate, { ...s, exercises: s.exercises.filter((_, idx) => idx !== i) });
  }

  function addSet(exIdx) {
    const s = getSession(selectedDate);
    const ex = s.exercises[exIdx];
    const last = ex.sets[ex.sets.length - 1];
    const exercises = s.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, { ...last }] } : e
    );
    updateSession(selectedDate, { ...s, exercises });
  }

  function removeSet(exIdx, setIdx) {
    const s = getSession(selectedDate);
    if (s.exercises[exIdx].sets.length === 1) return;
    const exercises = s.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e
    );
    updateSession(selectedDate, { ...s, exercises });
  }

  function updateSet(exIdx, setIdx, field, value) {
    const s = getSession(selectedDate);
    const exercises = s.exercises.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.map((set, j) => j === setIdx ? { ...set, [field]: value } : set) };
    });
    updateSession(selectedDate, { ...s, exercises });
  }

  function updateNotes(val) {
    const s = getSession(selectedDate);
    updateSession(selectedDate, { ...s, notes: val });
  }

  function deleteSession(date) {
    const nd = { ...data };
    delete nd[date];
    setData(nd);
    saveData(nd);
    notify("Sesión eliminada");
  }

  const session = getSession(selectedDate);
  const sortedDates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const totalVolume = session.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) =>
      (set.weight && set.reps) ? s + parseFloat(set.weight) * parseInt(set.reps) : s, 0), 0);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0a",
      color: "#f5f0e8",
      fontFamily: "'Courier New', monospace",
      paddingBottom: 80,
      maxWidth: 480,
      margin: "0 auto",
    }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a1a",
        padding: "env(safe-area-inset-top, 16px) 20px 16px",
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end"
      }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: "#444", marginBottom: 3 }}>DIARIO DE</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1 }}>ENTRENAMIENTO</div>
        </div>
        <div style={{ fontSize: 11, color: "#444", textAlign: "right" }}>
          {formatDate(todayStr())}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#111", border: "1px solid #2a2a2a", color: "#f5f0e8",
          padding: "8px 20px", borderRadius: 2, fontSize: 11, letterSpacing: 2,
          zIndex: 1000, whiteSpace: "nowrap", pointerEvents: "none"
        }}>{notification}</div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #151515", padding: "0 20px" }}>
        {[["today", "HOY"], ["history", "HISTORIAL"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{
            background: "none", border: "none",
            color: view === key ? "#f5f0e8" : "#3a3a3a",
            fontFamily: "inherit", fontSize: 10, letterSpacing: 3,
            padding: "13px 16px 11px", cursor: "pointer",
            borderBottom: view === key ? "2px solid #f5f0e8" : "2px solid transparent",
            marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {/* ── TODAY VIEW ── */}
      {view === "today" && (
        <div style={{ padding: "0 20px" }}>

          {/* Date picker */}
          <div style={{ padding: "14px 0 8px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: "#444" }}>SESIÓN</span>
            <input type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                background: "none", border: "none", color: "#f5f0e8",
                fontFamily: "inherit", fontSize: 13, cursor: "pointer", outline: "none"
              }}
            />
          </div>

          {/* Stats */}
          {session.exercises.length > 0 && (
            <div style={{
              display: "flex", gap: 20, padding: "8px 0 14px",
              borderBottom: "1px solid #141414", marginBottom: 8
            }}>
              <Stat label="Ejercicios" value={session.exercises.length} />
              <Stat label="Series" value={session.exercises.reduce((n, e) => n + e.sets.length, 0)} />
              {totalVolume > 0 && <Stat label="Volumen kg" value={Math.round(totalVolume).toLocaleString()} />}
            </div>
          )}

          {/* Exercise list */}
          {session.exercises.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#252525" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>—</div>
              <div style={{ fontSize: 10, letterSpacing: 3 }}>SIN EJERCICIOS</div>
            </div>
          ) : (
            session.exercises.map((ex, exIdx) => {
              const color = GROUP_COLORS[ex.group] || "#888";
              const isCardio = ex.group === "Cardio";
              const last = !isCardio ? getLastSession(data, ex.name, selectedDate) : null;
              const history = !isCardio ? getProgressHistory(data, ex.name) : [];
              return (
                <div key={exIdx} style={{
                  borderLeft: `2px solid ${color}`, paddingLeft: 14,
                  marginBottom: 22, paddingTop: 2
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 9, letterSpacing: 3, color }}>{(ex.group || "").toUpperCase()}</span>
                        {last?.maxWeight && (
                          <span style={{ fontSize: 10, color: "#555" }}>
                            última vez: <span style={{ color: "#888" }}>{last.maxWeight}kg</span>
                            <span style={{ color: "#383838" }}> ({formatDate(last.date)})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {history.length > 1 && (
                        <button onClick={() => setProgressEx(ex.name)} style={{
                          background: "none", border: "none", color: "#333",
                          fontSize: 14, cursor: "pointer", lineHeight: 1, padding: "0 4px"
                        }} title="Ver progreso">📈</button>
                      )}
                      <button onClick={() => removeExercise(exIdx)} style={{
                        background: "none", border: "none", color: "#2a2a2a",
                        fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 2px"
                      }}>×</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {ex.sets.map((set, setIdx) => (
                      <div key={setIdx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "#333", width: 18, textAlign: "right" }}>{setIdx + 1}</span>
                        {isCardio ? (<>
                          <NumInput value={set.minutes} onChange={v => updateSet(exIdx, setIdx, "minutes", v)} placeholder="min" suffix="min" />
                          <NumInput value={set.km} onChange={v => updateSet(exIdx, setIdx, "km", v)} placeholder="km" suffix="km" />
                        </>) : (<>
                          <NumInput value={set.weight} onChange={v => updateSet(exIdx, setIdx, "weight", v)} placeholder="kg" suffix="kg" />
                          <NumInput value={set.reps} onChange={v => updateSet(exIdx, setIdx, "reps", v)} placeholder="reps" suffix="×" suffixBefore />
                        </>)}
                        {ex.sets.length > 1 && (
                          <button onClick={() => removeSet(exIdx, setIdx)} style={{
                            background: "none", border: "none", color: "#252525",
                            fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0
                          }}>−</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => addSet(exIdx)} style={{
                    marginTop: 8, background: "none", border: "1px solid #1a1a1a",
                    color: "#444", fontFamily: "inherit", fontSize: 9, letterSpacing: 2,
                    padding: "5px 12px", cursor: "pointer", borderRadius: 1
                  }}>+ SERIE</button>
                </div>
              );
            })
          )}

          {/* Notes */}
          <div style={{ marginTop: 4, marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#333", marginBottom: 6 }}>NOTAS</div>
            <textarea
              value={session.notes} onChange={e => updateNotes(e.target.value)}
              placeholder="PR, sensaciones, peso corporal..."
              style={{
                width: "100%", background: "#0d0d0d", border: "1px solid #191919",
                color: "#f5f0e8", fontFamily: "inherit", fontSize: 12, padding: 10,
                resize: "none", outline: "none", borderRadius: 1, minHeight: 60, lineHeight: 1.5
              }}
            />
          </div>

          {/* Add exercise toggle */}
          <button onClick={() => setShowAddExercise(!showAddExercise)} style={{
            width: "100%",
            background: showAddExercise ? "#f5f0e8" : "none",
            border: "1px solid #2a2a2a",
            color: showAddExercise ? "#0a0a0a" : "#f5f0e8",
            fontFamily: "inherit", fontSize: 10, letterSpacing: 3,
            padding: "13px", cursor: "pointer", borderRadius: 1
          }}>
            {showAddExercise ? "✕ CERRAR" : "+ AÑADIR EJERCICIO"}
          </button>

          {/* Add exercise panel */}
          {showAddExercise && (
            <div style={{ marginTop: 12 }}>

              {/* Sub-tabs: Lista / Personalizado */}
              <div style={{ display: "flex", marginBottom: 12, borderBottom: "1px solid #141414" }}>
                {[["list", "LISTA"], ["custom", "PERSONALIZADO"]].map(([key, label]) => (
                  <button key={key} onClick={() => setAddTab(key)} style={{
                    background: "none", border: "none",
                    color: addTab === key ? "#f5f0e8" : "#333",
                    fontFamily: "inherit", fontSize: 9, letterSpacing: 2,
                    padding: "8px 14px 7px", cursor: "pointer",
                    borderBottom: addTab === key ? "1px solid #f5f0e8" : "1px solid transparent",
                    marginBottom: -1
                  }}>{label}</button>
                ))}
              </div>

              {addTab === "list" && (<>
                {/* Muscle group filter */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {ALL_GROUPS.map(g => (
                    <button key={g} onClick={() => setFilterGroup(g)} style={{
                      background: filterGroup === g ? GROUP_COLORS[g] : "#111",
                      border: "none",
                      color: filterGroup === g ? "#fff" : "#444",
                      fontFamily: "inherit", fontSize: 9, letterSpacing: 2,
                      padding: "5px 11px", cursor: "pointer", borderRadius: 1,
                      fontWeight: filterGroup === g ? 700 : 400
                    }}>{g.toUpperCase()}</button>
                  ))}
                </div>

                {/* Exercise list for selected group */}
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(EXERCISES_BY_GROUP[filterGroup] || []).map(name => {
                    const last = getLastSession(data, name, selectedDate);
                    return (
                      <button key={name} onClick={() => addExercise(name, filterGroup)} style={{
                        background: "#0d0d0d", border: "none", color: "#bbb",
                        fontFamily: "inherit", fontSize: 12, padding: "11px 12px",
                        textAlign: "left", cursor: "pointer", borderRadius: 1,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderLeft: `2px solid ${GROUP_COLORS[filterGroup]}`
                      }}>
                        <span>{name}</span>
                        <span style={{ fontSize: 10, color: "#444", textAlign: "right" }}>
                          {last?.maxWeight ? `${last.maxWeight}kg` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>)}

              {addTab === "custom" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Zone selector */}
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 8 }}>ZONA MUSCULAR</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ALL_GROUPS.map(g => (
                        <button key={g} onClick={() => setCustomGroup(g)} style={{
                          background: customGroup === g ? GROUP_COLORS[g] : "#111",
                          border: customGroup === g ? "none" : "1px solid #1e1e1e",
                          color: customGroup === g ? "#fff" : "#444",
                          fontFamily: "inherit", fontSize: 9, letterSpacing: 2,
                          padding: "6px 12px", cursor: "pointer", borderRadius: 1,
                          fontWeight: customGroup === g ? 700 : 400
                        }}>{g.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  {/* Custom name input */}
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 8 }}>NOMBRE DEL EJERCICIO</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                        placeholder="Ej: Face pull..."
                        style={{
                          flex: 1, background: "#0d0d0d", border: "1px solid #1a1a1a",
                          color: "#f5f0e8", fontFamily: "inherit", fontSize: 13,
                          padding: "9px 10px", outline: "none", borderRadius: 1
                        }}
                      />
                      <button onClick={addCustomExercise} style={{
                        background: customGroup ? GROUP_COLORS[customGroup] : "#1a1a1a",
                        border: "none", color: "#fff",
                        fontFamily: "inherit", fontSize: 10, letterSpacing: 2,
                        padding: "9px 16px", cursor: "pointer", borderRadius: 1, fontWeight: 700
                      }}>ADD</button>
                    </div>
                  </div>

                  {/* Preview */}
                  {customName.trim() && (
                    <div style={{
                      padding: "10px 12px", background: "#0d0d0d",
                      borderLeft: `2px solid ${GROUP_COLORS[customGroup] || "#888"}`,
                      fontSize: 12, display: "flex", justifyContent: "space-between"
                    }}>
                      <span>{customName.trim()}</span>
                      <span style={{ fontSize: 9, letterSpacing: 2, color: GROUP_COLORS[customGroup] || "#888" }}>
                        {customGroup.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS MODAL ── */}
      {progressEx && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000ee",
          zIndex: 200, display: "flex", alignItems: "flex-end"
        }} onClick={() => setProgressEx(null)}>
          <div style={{
            width: "100%", maxWidth: 480, margin: "0 auto",
            background: "#0d0d0d", borderTop: "1px solid #222",
            padding: "20px 20px 40px",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 4 }}>PROGRESIÓN</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{progressEx}</div>
              </div>
              <button onClick={() => setProgressEx(null)} style={{
                background: "none", border: "none", color: "#444",
                fontSize: 22, cursor: "pointer", lineHeight: 1
              }}>×</button>
            </div>
            <ProgressChart data={getProgressHistory(data, progressEx)} />
          </div>
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === "history" && (
        <div style={{ padding: "0 20px" }}>
          {sortedDates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#252525" }}>
              <div style={{ fontSize: 10, letterSpacing: 3 }}>SIN SESIONES GUARDADAS</div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {sortedDates.map(date => {
                const s = data[date];
                const groups = [...new Set(s.exercises.map(e => e.group).filter(Boolean))];
                const vol = s.exercises.reduce((sum, ex) =>
                  sum + ex.sets.reduce((ss, set) =>
                    (set.weight && set.reps) ? ss + parseFloat(set.weight) * parseInt(set.reps) : ss, 0), 0);
                return (
                  <div key={date} style={{ borderBottom: "1px solid #111", paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{formatDate(date)}</div>
                        <div style={{ fontSize: 9, color: "#383838", marginTop: 2, letterSpacing: 2 }}>
                          {s.exercises.length} EJERC · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} SERIES
                          {vol > 0 && ` · ${Math.round(vol).toLocaleString()} KG`}
                        </div>
                      </div>
                      <button onClick={() => deleteSession(date)} style={{
                        background: "none", border: "none", color: "#1e1e1e",
                        fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1
                      }}>×</button>
                    </div>

                    {/* Group tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {groups.map(g => (
                        <span key={g} style={{
                          fontSize: 8, letterSpacing: 2, padding: "2px 8px",
                          background: "#111", color: GROUP_COLORS[g] || "#555", borderRadius: 1
                        }}>{g.toUpperCase()}</span>
                      ))}
                    </div>

                    {/* Exercise summary */}
                    {s.exercises.map((ex, i) => {
                      const isCardio = ex.group === "Cardio";
                      const color = GROUP_COLORS[ex.group] || "#555";
                      const hasHistory = !isCardio && getProgressHistory(data, ex.name).length > 1;
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "#666", marginBottom: 4,
                          paddingLeft: 8, borderLeft: `1px solid ${color}30`
                        }}>
                          <span
                            onClick={hasHistory ? () => setProgressEx(ex.name) : undefined}
                            style={{ cursor: hasHistory ? "pointer" : "default", color: hasHistory ? "#888" : "#666" }}
                          >{ex.name}{hasHistory ? " 📈" : ""}</span>
                          <span style={{ color: "#333", fontSize: 11 }}>
                            {isCardio
                              ? ex.sets.map(s => [s.minutes && `${s.minutes}min`, s.km && `${s.km}km`].filter(Boolean).join(" ")).filter(Boolean).join(" / ")
                              : ex.sets.map(s => [s.weight && `${s.weight}kg`, s.reps && `×${s.reps}`].filter(Boolean).join("")).filter(Boolean).join(" / ")
                            }
                          </span>
                        </div>
                      );
                    })}
                    {s.notes && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#2e2e2e", fontStyle: "italic" }}>{s.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 8, color: "#383838", letterSpacing: 2 }}>{label.toUpperCase()}</div>
    </div>
  );
}

function ProgressChart({ data }) {
  if (!data || data.length < 2) return null;
  const W = 320, H = 140, PL = 36, PR = 12, PT = 10, PB = 30;
  const weights = data.map(d => d.maxWeight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const pts = data.map((d, i) => ({
    x: PL + (i / (data.length - 1)) * cW,
    y: PT + cH - ((d.maxWeight - minW) / range) * cH,
    ...d
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${PT+cH} L ${pts[0].x} ${PT+cH} Z`;

  // Y axis labels
  const yLabels = [minW, minW + range/2, maxW].map((v, i) => ({
    y: PT + cH - (i * cH / 2),
    label: Math.round(v) + "kg"
  }));

  // X axis: show first, middle, last date
  const xLabels = [0, Math.floor((data.length-1)/2), data.length-1].map(i => ({
    x: PL + (i / (data.length-1)) * cW,
    label: formatDate(data[i].date).slice(0,5)
  }));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <line key={i} x1={PL} y1={l.y} x2={W-PR} y2={l.y}
            stroke="#1a1a1a" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="#ef444411" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        {/* Points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ef4444" />
        ))}
        {/* Y labels */}
        {yLabels.map((l, i) => (
          <text key={i} x={PL-4} y={l.y+4} textAnchor="end"
            fontSize="8" fill="#444" fontFamily="Courier New">
            {l.label}
          </text>
        ))}
        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H-4} textAnchor="middle"
            fontSize="8" fill="#444" fontFamily="Courier New">
            {l.label}
          </text>
        ))}
      </svg>
      {/* PR badge */}
      <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{Math.max(...weights)}kg</div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>RÉCORD</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{data.length}</div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>SESIONES</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: weights[weights.length-1] >= weights[0] ? "#22c55e" : "#ef4444" }}>
            {weights[weights.length-1] >= weights[0] ? "+" : ""}{Math.round(weights[weights.length-1] - weights[0])}kg
          </div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#444" }}>PROGRESO</div>
        </div>
      </div>
    </div>
  );
}

function NumInput({ value, onChange, placeholder, suffix, suffixBefore }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {suffixBefore && <span style={{ fontSize: 11, color: "#333", width: 12 }}>{suffix}</span>}
      <input
        type="number" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        style={{
          width: 62, background: "#111", border: "1px solid #1a1a1a",
          color: "#f5f0e8", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
          padding: "7px 4px", outline: "none", borderRadius: 1, textAlign: "center"
        }}
      />
      {!suffixBefore && <span style={{ fontSize: 11, color: "#333", width: 22 }}>{suffix}</span>}
    </div>
  );
}
