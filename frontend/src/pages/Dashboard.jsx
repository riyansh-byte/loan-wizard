import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import StatusChip from '../components/ui/StatusChip';
import FraudScoreBar from '../components/ui/FraudScoreBar';
import './Dashboard.css';

/* ── Mock Data ──────────────────────────────────────── */
const MOCK_SESSIONS = [
  { id: 'LW-2048-A1', session_id: 'sess_a1b2c3d4', customer_name: 'Rahul Sharma',     started_at: '2026-04-12T08:15:00Z', status: 'approved',  fraud_score: 12, offer_amount: 500000 },
  { id: 'LW-2049-B2', session_id: 'sess_b2c3d4e5', customer_name: 'Priya Mehta',      started_at: '2026-04-12T08:42:00Z', status: 'in-review', fraud_score: 38, offer_amount: 350000 },
  { id: 'LW-2050-C3', session_id: 'sess_c3d4e5f6', customer_name: 'Amitesh Verma',   started_at: '2026-04-12T09:05:00Z', status: 'flagged',   fraud_score: 74, offer_amount: 0      },
  { id: 'LW-2051-D4', session_id: 'sess_d4e5f6g7', customer_name: 'Sunita Yadav',    started_at: '2026-04-12T09:28:00Z', status: 'pending',   fraud_score: 21, offer_amount: 450000 },
  { id: 'LW-2052-E5', session_id: 'sess_e5f6g7h8', customer_name: 'Kiran Bose',      started_at: '2026-04-12T09:55:00Z', status: 'approved',  fraud_score: 8,  offer_amount: 750000 },
  { id: 'LW-2053-F6', session_id: 'sess_f6g7h8i9', customer_name: 'Deepak Nair',     started_at: '2026-04-12T10:10:00Z', status: 'in-review', fraud_score: 45, offer_amount: 600000 },
  { id: 'LW-2054-G7', session_id: 'sess_g7h8i9j0', customer_name: 'Anita Pillai',    started_at: '2026-04-12T10:33:00Z', status: 'approved',  fraud_score: 17, offer_amount: 300000 },
  { id: 'LW-2055-H8', session_id: 'sess_h8i9j0k1', customer_name: 'Ravi Krishnamurthy', started_at: '2026-04-12T10:58:00Z', status: 'flagged', fraud_score: 88, offer_amount: 0 },
];

const fetchSessions = async () => {
  await new Promise(r => setTimeout(r, 200));
  return MOCK_SESSIONS;
};

/* ── Helpers ────────────────────────────────────────── */
const formatINR = (amount) => amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—';
const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

/* ── Components ─────────────────────────────────────── */
const StatCard = ({ label, value, accent, sublabel }) => (
  <div className={`stat-card ${accent ? `stat-card--${accent}` : ''}`}>
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__value mono">{value}</span>
    {sublabel && <span className="stat-card__sub">{sublabel}</span>}
  </div>
);

const GroupHeader = ({ title, count, isOpen, onToggle, variant }) => (
  <div className={`status-group__header status-group__header--${variant}`} onClick={onToggle}>
    <span className="status-group__title">{title}</span>
    <span className="status-group__count">{count}</span>
    <svg className="status-group__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({
    pending: true,
    review: true,
    flagged: true,
    approved: true
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    refetchInterval: 5000,
  });

  const stats = useMemo(() => {
    const total = sessions.length;
    const approved = sessions.filter(s => s.status === 'approved').length;
    const flagged = sessions.filter(s => s.status === 'flagged').length;
    return { total, approved, flagged, avgTime: '4m 32s' };
  }, [sessions]);

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedSessions = useMemo(() => {
    return {
      pending: sessions.filter(s => s.status === 'pending'),
      review: sessions.filter(s => s.status === 'in-review'),
      flagged: sessions.filter(s => s.status === 'flagged'),
      approved: sessions.filter(s => s.status === 'approved'),
    };
  }, [sessions]);

  const renderGroup = (key, title, variant) => {
    const groupItems = groupedSessions[key];
    if (groupItems.length === 0) return null;

    return (
      <div className={`status-group ${openGroups[key] ? 'status-group--open' : ''}`} key={key}>
        <GroupHeader
          title={title}
          count={groupItems.length}
          isOpen={openGroups[key]}
          onToggle={() => toggleGroup(key)}
          variant={variant}
        />
        <div className="status-group__rows">
          {groupItems.map(session => (
            <Link to={`/dashboard/session/${session.session_id}`} className="table-row" key={session.session_id}>
              <div className="table-cell table-cell--mono text-muted">{session.id}</div>
              <div className="table-cell table-cell--name">{session.customer_name}</div>
              <div className="table-cell table-cell--mono text-muted">{formatTime(session.started_at)}</div>
              <div className="table-cell"><StatusChip status={session.status} /></div>
              <div className="table-cell"><FraudScoreBar score={session.fraud_score} /></div>
              <div className="table-cell table-cell--amount">{formatINR(session.offer_amount)}</div>
              <div className="table-cell">
                <span className="action-link">View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <section className="stats-row">
        <StatCard label="Total Sessions Today" value={stats.total} sublabel="↑ 3 from yesterday" />
        <StatCard label="Approved" value={stats.approved} accent="success" sublabel={`${Math.round((stats.approved/stats.total)*100)||0}% approval rate`} />
        <StatCard label="Flagged" value={stats.flagged} accent="danger" sublabel="Require manual review" />
        <StatCard label="Avg. Processing" value={stats.avgTime} sublabel="End-to-end time" />
      </section>

      <div className="table-container">
        <header className="table-header">
          <div className="table-header__cell">Session ID</div>
          <div className="table-header__cell">Customer Name</div>
          <div className="table-header__cell">Started At</div>
          <div className="table-header__cell">Status</div>
          <div className="table-header__cell">Fraud Score</div>
          <div className="table-header__cell">Offer Amount</div>
          <div className="table-header__cell">Actions</div>
        </header>

        {renderGroup('pending', 'Pending', 'pending')}
        {renderGroup('review', 'In Review', 'review')}
        {renderGroup('flagged', 'Flagged', 'flagged')}
        {renderGroup('approved', 'Approved', 'approved')}
      </div>
    </Layout>
  );
};

export default Dashboard;
