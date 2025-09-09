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
    pageWrapper: {
        minHeight: "100vh",
        width: '100%',
        background: "#f0f2f5",
        fontFamily: "system-ui, sans-serif",
    },
    // [수정됨] 사이드바가 화면 위에 뜨도록 position: fixed 사용
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
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', // 슬라이드 애니메이션
        transition: 'transform 250ms ease-in-out',
        whiteSpace: 'nowrap',
    }),
    // [추가됨] 사이드바 배경
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
    // [추가됨] 토글 스위치 스타일
    switch: (checked) => ({
        cursor: 'pointer',
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#1890ff' : '#bfbfbf',
        position: 'relative',
        transition: 'background 200ms',
    }),
    switchThumb: (checked) => ({
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: 2,
        left: 2,
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 200ms',
    }),
    editToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#374151',
        fontSize: 14,
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

// ---- 차트 컴포넌트 ----
const SimplePieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    return (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <svg viewBox="0 0 100 100" width="120" height="120">
                {data.map(item => {
                    const percentage = (item.value / total) * 100;
                    const startAngle = (cumulative / total) * 360;
                    const endAngle = startAngle + (item.value / total) * 360;
                    cumulative += item.value;
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                    const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                    const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                    const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                    return <path key={item.name} d={`M 50,50 L ${x1},${y1} A 50,50 0 ${largeArcFlag} 1 ${x2},${y2} Z`} fill={item.color} />;
                })}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                {data.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, background: item.color, borderRadius: '50%' }}></span>
                        {item.name} ({item.value}명)
                    </div>
                ))}
            </div>
        </div>
    );
};

const SimpleLineChart = ({ data }) => (
    <div style={{ width: '100%', height: '100%', padding: '10px 0' }}>
        <svg viewBox="0 0 300 150" width="100%" height="100%">
            <path d="M 20 130 L 280 130" stroke="#ccc" strokeWidth="1" />
            <path d="M 20 20 L 20 130" stroke="#ccc" strokeWidth="1" />
            {data.map(dataset => (
                <polyline
                    key={dataset.color}
                    fill="none"
                    stroke={dataset.color}
                    strokeWidth="2"
                    points={dataset.points.map(p => `${20 + (p.x / 30) * 260},${130 - (p.y / 2000) * 100}`).join(' ')}
                />
            ))}
        </svg>
    </div>
);

// ---- 데이터 ----
const PIE_CHART_DATA = [{ name: "통화중", value: 2, color: '#5470c6' }, { name: "대기중", value: 3, color: '#91cc75' }, { name: "자리비움", value: 1, color: '#fac858' }, { name: "후처리", value: 2, color: '#ee6666' },];
const LINE_CHART_DATA = [{ color: '#5470c6', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 1000 + Math.random() * 500 })) }, { color: '#91cc75', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 800 + Math.random() * 400 })) }, { color: '#ee6666', points: Array.from({ length: 31 }, (_, i) => ({ x: i, y: 600 + Math.random() * 600 })) },];
const DEFAULT_WIDGETS = [{ id: "w_total", title: "전체 접속", icon: "👥", size: 1, type: 'stat' }, { id: "w_req", title: "상담 요청", icon: "📞", size: 1, type: 'stat' }, { id: "w_done", title: "처리 완료", icon: "✅", size: 1, type: 'stat' }, { id: "w_kpi", title: "처리율", icon: "📈", size: 1, type: 'stat' }, { id: "w_sla", title: "SLA 충족률", icon: "🛡️", size: 1, type: 'stat' }, { id: "w_consultant_status", title: "상담원 상태", size: 2, type: 'pieChart', data: PIE_CHART_DATA }, { id: "w_traffic_trend", title: "전체 접속건수", size: 2, type: 'lineChart', data: LINE_CHART_DATA }, { id: "w_today", title: "금일 접속건수", icon: "📅", size: 1, type: 'stat' },];
const LS_KEY = "interactive-dashboard-v3";

// ---- 로컬스토리지 상태 ----
function usePersistedState(initial) {
    const [state, setState] = useState(() => { try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {} return initial; });
    useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {} }, [state]);
    return [state, setState];
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

const ToggleSwitch = ({ checked, onChange }) => (
    <div style={styles.switch(checked)} onClick={() => onChange(!checked)}>
        <div style={styles.switchThumb(checked)}></div>
    </div>
);

function Sidebar({ isOpen, onClose }) {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    return (
        <>
            <div style={styles.backdrop(isOpen)} onClick={onClose} />
            <div style={styles.sidebar(isOpen)}>
                <div style={styles.sidebarHeader}>모니터링</div>
                <div style={styles.sidebarMenu}>
                    <div style={styles.sidebarItem(activeMenu === 'dashboard')} onClick={() => setActiveMenu('dashboard')}>대시보드</div>
                    <div style={styles.sidebarItem(activeMenu === 'details')} onClick={() => setActiveMenu('details')}>상세 현황</div>
                </div>
            </div>
        </>
    );
}

function Header({ onToggleSidebar }) {
    return (
        <div style={styles.header}>
            <div style={styles.headerLeft}>
                <button onClick={onToggleSidebar} style={styles.menuBtn} title="메뉴 열기">
                    <GridIcon />
                </button>
                <h1 style={styles.pageTitle}>대시보드</h1>
            </div>
        </div>
    );
}

function FilterBar({ editable, setEditable, onReset, onSave, onCancel }) {
    return (
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} defaultValue="all"><option value="all">고객사: 전체</option></select>
                <select style={styles.select} defaultValue="all"><option value="all">인스턴스: 전체</option></select>
                <input type="date" style={styles.input} defaultValue="2025-09-08" />
                <button style={styles.searchBtn}>조회</button>
            </div>
            <div style={styles.controlsGroup}>
                {editable && (
                    <>
                        <button style={styles.resetBtn} onClick={onReset}>초기화</button>
                        <button style={styles.resetBtn} onClick={onSave}>저장</button>
                        <button style={styles.resetBtn} onClick={onCancel}>취소</button>
                    </>
                )}
                <div style={styles.editToggle}>
                    <span>편집</span>
                    <ToggleSwitch checked={editable} onChange={setEditable} />
                </div>
            </div>
        </div>
    );
}

function SortableCard({ id, item, editable, onHide }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editable });
    const style = { transform: CSS.Transform.toString(transform), transition, touchAction: "none", cursor: editable ? "grab" : "default" };
    const renderBody = () => {
        switch (item.type) {
            case 'pieChart': return <SimplePieChart data={item.data} />;
            case 'lineChart': return <SimpleLineChart data={item.data} />;
            default: return <div style={styles.statBody}><span style={styles.icon}>{item.icon}</span><span style={styles.statValue}>n건</span></div>;
        }
    };
    return (
        <div style={{ ...styles.cardWrap(item.size), ...style }} ref={setNodeRef} {...(editable ? { ...attributes, ...listeners } : {})}>
            <div style={styles.card(isDragging)}>
                <div style={styles.cardHeader}>
                    <div style={styles.cardTitle}>{item.title}</div>
                    {editable && <button type="button" style={styles.hideBtn} onPointerDown={(e) => e.stopPropagation()} onClick={() => onHide(id)} title="화면에서 제거">✕</button>}
                </div>
                <div style={styles.cardBody}>{renderBody()}</div>
            </div>
        </div>
    );
}

function SortableBinItem({ id, title }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, ...styles.binItem };
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{title}</div>;
}

// ---- 메인 ----
export default function DashboardV5() {
    const initial = useMemo(() => ({
        dashboard: DEFAULT_WIDGETS.map((w) => w.id),
        hidden: [],
    }), []);
    // 로컬스토리지에서 불러온 상태
    const [savedState, setSavedState] = usePersistedState(initial);

    // 현재 작업중인 상태 (편집중에는 이걸 수정)
    const [state, setState] = useState(savedState);

    // 편집모드 여부 (초기값 false)
    const [editable, setEditable] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const byId = useMemo(() => Object.fromEntries(DEFAULT_WIDGETS.map((w) => [w.id, w])), []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragEnd = ({ active, over }) => {
        if (!editable) return;

        // 1. 숨김 박스 빈 영역에 드롭 (over가 없거나 over.id가 숨김 박스 아이디일 때)
        if (!over) {
            // active.id를 dashboard에서 제거하고 hidden에 추가
            if (state.dashboard.includes(active.id)) {
                setState(prev => ({
                    ...prev,
                    dashboard: prev.dashboard.filter(id => id !== active.id),
                    hidden: [...prev.hidden, active.id]
                }));
            }
            return;
        }

        // 2. 기존 처리: 같은 컨테이너 내 이동 혹은 컨테이너 간 이동
        if (active.id === over.id) return;

        const activeContainer = state.dashboard.includes(active.id) ? 'dashboard' : 'hidden';
        const overContainer = state.dashboard.includes(over.id) ? 'dashboard' : state.hidden.includes(over.id) ? 'hidden' : null;

        if (!overContainer) return;

        if (activeContainer === overContainer) {
            const oldIndex = state[activeContainer].indexOf(active.id);
            const newIndex = state[overContainer].indexOf(over.id);
            setState(prev => ({
                ...prev,
                [activeContainer]: arrayMove(prev[activeContainer], oldIndex, newIndex)
            }));
        } else {
            setState(prev => ({
                ...prev,
                [activeContainer]: prev[activeContainer].filter(id => id !== active.id),
                [overContainer]: [...prev[overContainer], active.id]
            }));
        }
    };

    const hideWidget = (id) => {
        if (!editable) return;
        setState({ ...state, dashboard: state.dashboard.filter((x) => x !== id), hidden: [...state.hidden, id] });
    };
    const restoreWidget = (id) => {
        if (!editable) return;
        setState({ ...state, dashboard: [...state.dashboard, id], hidden: state.hidden.filter((x) => x !== id) });
    };
    const resetAll = () => setState(initial);

    // 저장 버튼: 현재 편집중인 상태를 로컬스토리지에 저장
    const onSave = () => {
        setSavedState(state);
        setEditable(false);
    };

    // 취소 버튼: 저장된 상태로 되돌리기
    const onCancel = () => {
        setState(savedState);
        setEditable(false);
    };

    return (
        <div style={styles.pageWrapper}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div style={styles.mainContent}>
                <Header onToggleSidebar={() => setSidebarOpen(true)} />
                <FilterBar
                    editable={editable}
                    setEditable={setEditable}
                    onReset={resetAll}
                    onSave={onSave}
                    onCancel={onCancel}
                />
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                    <SortableContext items={state.dashboard} strategy={rectSortingStrategy}>
                        <div style={styles.grid}>
                            {state.dashboard.map((id) => (
                                <SortableCard
                                    key={id}
                                    id={id}
                                    item={byId[id]}
                                    editable={editable}
                                    onHide={hideWidget}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <div style={styles.hiddenBox}>
                        <b>숨김 보관함</b>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                            {state.hidden.length === 0 ? (
                                <span style={{ fontSize: 13, color: '#6b7280' }}>비어 있음</span>
                            ) : (
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

