import { useState, useEffect } from "react";

const EXERCISES_BY_GROUP = {
  "Pecho":    ["Press banca", "Press inclinado", "Press declinado", "Aperturas", "Fondos en paralelas", "Crossover"],
  "Hombros":  ["Press militar", "Elevaciones laterales", "Elevaciones frontales", "Pájaros", "Press Arnold"],
  "Espalda":  ["Remo con barra", "Remo con mancuerna", "Dominadas", "Jalón al pecho", "Peso muerto", "Remo en polea"],
  "Piernas":  ["Sentadilla", "Prensa", "Extensión de cuádriceps", "Curl femoral", "Hip thrust", "Zancadas", "Peso muerto rumano", "Gemelos en máquina"],
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
              return (
                <div key={exIdx} style={{
                  borderLeft: `2px solid ${color}`, paddingLeft: 14,
                  marginBottom: 22, paddingTop: 2
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                      <div style={{ fontSize: 9, letterSpacing: 3, color, marginTop: 2 }}>{(ex.group || "").toUpperCase()}</div>
                    </div>
                    <button onClick={() => removeExercise(exIdx)} style={{
                      background: "none", border: "none", color: "#2a2a2a",
                      fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 2px"
                    }}>×</button>
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
                  {(EXERCISES_BY_GROUP[filterGroup] || []).map(name => (
                    <button key={name} onClick={() => addExercise(name, filterGroup)} style={{
                      background: "#0d0d0d", border: "none", color: "#bbb",
                      fontFamily: "inherit", fontSize: 12, padding: "11px 12px",
                      textAlign: "left", cursor: "pointer", borderRadius: 1,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderLeft: `2px solid ${GROUP_COLORS[filterGroup]}`
                    }}>
                      <span>{name}</span>
                      <span style={{ fontSize: 12, color: GROUP_COLORS[filterGroup], opacity: 0.5 }}>+</span>
                    </button>
                  ))}
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
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "#666", marginBottom: 4,
                          paddingLeft: 8, borderLeft: `1px solid ${color}30`
                        }}>
                          <span>{ex.name}</span>
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
