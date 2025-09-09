import React, { useEffect, useMemo, useState } from "react";
import {
    DndContext,
    closestCorners,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensors,
    useSensor,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---- 스타일 객체 ----
const styles = {
    // ... (이전 스타일은 그대로 유지) ...
    pageWrapper: {
        minHeight: "100vh",
        width: '100%',
        background: "#f0f2f5",
        fontFamily: "system-ui, sans-serif",
    },
    sidebar: (isOpen) => ({
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 220,
        background: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 250ms ease-in-out',
        whiteSpace: 'nowrap',
    }),
    backdrop: (isOpen) => ({
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 99,
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 250ms ease-in-out, visibility 250ms',
    }),
    sidebarHeader: {
        padding: '8px 4px',
        marginBottom: 8,
        borderBottom: '1px solid #e0e0e0',
        fontSize: 16,
        fontWeight: 600,
        color: '#111827'
    },
    sidebarMenu: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    sidebarItem: (isActive) => ({
        padding: '10px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        background: isActive ? '#e6f7ff' : 'transparent',
        color: isActive ? '#096dd9' : '#374151',
        border: isActive ? '1px solid #91d5ff' : '1px solid transparent',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 150ms ease-in-out',
    }),
    mainContent: {
        padding: 16,
        overflow: 'auto',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 600,
        color: '#111827'
    },
    menuBtn: {
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        width: 36,
        height: 36,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBar: {
        background: 'white',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid #e0e0e0',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    filterGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    select: {
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        background: '#fff',
        color: '#374151'
    },
    input: {
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        width: '120px',
    },
    searchBtn: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        background: '#1890ff',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
    },
    controlsGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    // [수정] 버튼 스타일 추가
    editBtn: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        background: '#1890ff',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        background: '#1890ff',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
    },
    cancelBtn: {
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        background: '#fff',
        cursor: 'pointer',
    },
    resetBtn: {
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        background: '#fff',
        cursor: 'pointer',
    },
    grid: {
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gridAutoFlow: 'dense',
    },
    cardWrap: (span = 1) => ({ gridColumn: `span ${span}`, minWidth: 0 }),
    card: (dragging) => ({
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        boxShadow: dragging ? "0 6px 24px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    }),
    cardHeader: {
        padding: "12px 14px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardTitle: { fontSize: 14, fontWeight: 600, color: "#111827" },
    hideBtn: {
        width: 28, height: 28, borderRadius: 16, border: "1px solid #fca5a5", background: "#fee2e2",
        color: '#b91c1c', cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
    },
    cardBody: {
        padding: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1,
    },
    statBody: { display: 'flex', alignItems: 'center', gap: 12 },
    icon: { fontSize: 32 },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    hiddenBox: {
        marginTop: 24, background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16,
    },
    binItem: {
        padding: '6px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8,
        cursor: 'grab', userSelect: 'none', fontSize: 13, color: '#374151'
    }
};

// ---- 차트 컴포넌트 (변경 없음) ----
const SimplePieChart = ({ data }) => {
    // ... (이전 코드와 동일) ...
};
const SimpleLineChart = ({ data }) => {
    // ... (이전 코드와 동일) ...
};

// ---- 데이터 (변경 없음) ----
const PIE_CHART_DATA = [{ name: "통화중", value: 2, color: '#5470c6' }, { name: "대기중", value: 3, color: '#91cc75' }, { name: "자리비움", value: 1, color: '#fac858' }, { name: "후처리", value: 2, color: '#ee6666' },];
const LINE_CHART_DATA = [{ color: '#5470c6', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 1000 + Math.random() * 500 })) }, { color: '#91cc75', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 800 + Math.random() * 400 })) }, { color: '#ee6666', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 600 + Math.random() * 600 })) },];
const DEFAULT_WIDGETS = [{ id: "w_total", title: "전체 접속", icon: "👥", size: 1, type: 'stat' }, { id: "w_req", title: "상담 요청", icon: "📞", size: 1, type: 'stat' }, { id: "w_done", title: "처리 완료", icon: "✅", size: 1, type: 'stat' }, { id: "w_kpi", title: "처리율", icon: "📈", size: 1, type: 'stat' }, { id: "w_sla", title: "SLA 충족률", icon: "🛡️", size: 1, type: 'stat' }, { id: "w_consultant_status", title: "상담원 상태", size: 2, type: 'pieChart', data: PIE_CHART_DATA }, { id: "w_traffic_trend", title: "전체 접속건수", size: 2, type: 'lineChart', data: LINE_CHART_DATA }, { id: "w_today", title: "금일 접속건수", icon: "📅", size: 1, type: 'stat' },];
const LS_KEY = "interactive-dashboard-v3";

// ---- 로컬스토리지 상태 (변경 없음) ----
function usePersistedState(initial) {
    // ... (이전 코드와 동일) ...
}

// ---- UI 컴포넌트 ----
const GridIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3H3V8H8V3Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 3H12V8H17V3Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 12H12V17H17V12Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12H3V17H8V12Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// [수정] ToggleSwitch 컴포넌트는 이제 사용되지 않으므로 삭제해도 됩니다.

function Sidebar({ isOpen, onClose }) {
    // ... (이전 코드와 동일) ...
}

function Header({ onToggleSidebar }) {
    // ... (이전 코드와 동일) ...
}

// [수정] FilterBar 컴포넌트를 새롭게 변경
function FilterBar({ editable, setEditable, onReset }) {
    return (
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} defaultValue="all"><option value="all">고객사: 전체</option></select>
                <select style={styles.select} defaultValue="all"><option value="all">인스턴스: 전체</option></select>
                <input type="date" style={styles.input} defaultValue="2025-09-08" />
                <button style={styles.searchBtn}>조회</button>
            </div>
            <div style={styles.controlsGroup}>
                {editable ? (
                    <>
                        <button style={styles.resetBtn} onClick={onReset}>초기화</button>
                        <button style={styles.cancelBtn} onClick={() => setEditable(false)}>취소</button>
                        <button style={styles.saveBtn} onClick={() => setEditable(false)}>저장</button>
                    </>
                ) : (
                    <button style={styles.editBtn} onClick={() => setEditable(true)}>편집</button>
                )}
            </div>
        </div>
    );
}

// SortableCard, SortableBinItem 컴포넌트는 변경 없음
function SortableCard({ id, item, editable, onHide }) {
    // ... (이전 코드와 동일) ...
}
function SortableBinItem({ id, title }) {
    // ... (이전 코드와 동일) ...
}

// ---- 메인 ----
export default function DashboardV5() {
    const initial = useMemo(() => ({ dashboard: DEFAULT_WIDGETS.map((w) => w.id), hidden: [] }), []);
    const [state, setState] = usePersistedState(initial);

    // [수정 1] editable의 기본값을 false로 변경
    const [editable, setEditable] = useState(false);

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const byId = useMemo(() => Object.fromEntries(DEFAULT_WIDGETS.map((w) => [w.id, w])), []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragEnd = ({ active, over }) => {
        // ... (이전 코드와 동일) ...
    };

    const hideWidget = (id) => setState({ ...state, dashboard: state.dashboard.filter((x) => x !== id), hidden: [...state.hidden, id] });
    const restoreWidget = (id) => setState({ ...state, dashboard: [...state.dashboard, id], hidden: state.hidden.filter((x) => x !== id) });
    const resetAll = () => setState(initial);

    return (
        <div style={styles.pageWrapper}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div style={styles.mainContent}>
                <Header onToggleSidebar={() => setSidebarOpen(true)} />
                {/* [수정 2] FilterBar에 setEditable을 그대로 전달 */}
                <FilterBar editable={editable} setEditable={setEditable} onReset={resetAll} />
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                    <SortableContext items={state.dashboard} strategy={rectSortingStrategy}>
                        <div style={styles.grid}>
                            {state.dashboard.map((id) => <SortableCard key={id} id={id} item={byId[id]} editable={editable} onHide={hideWidget} />)}
                        </div>
                    </SortableContext>
                    <div style={styles.hiddenBox}>
                        <b>숨김 보관함</b>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                            {state.hidden.length === 0 ? <span style={{ fontSize: 13, color: '#6b7280' }}>비어 있음</span> : (
                                <SortableContext items={state.hidden} strategy={rectSortingStrategy}>
                                    {state.hidden.map((id) => (
                                        <SortableBinItem key={id} id={id} title={byId[id].title} />
                                    ))}
                                </SortableContext>
                            )}
                        </div>
                    </div>
                </DndContext>
            </div>
        </div>
    );
}