import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Purchases, type Package } from '@revenuecat/purchases-js';
import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp,
  Clock3, FileCheck2, FileText, History, Home as HomeIcon, Info, LoaderCircle, LockKeyhole,
  Menu, MessageCircle, Plus, RefreshCcw, Search, ShieldCheck, Sparkles, Trash2,
  UploadCloud, X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  getGetDashboardQueryKey, getGetNoticeQueryKey, getListNoticesQueryKey,
  useAskNotice, useAnalyzeNotice, useCreateNotice, useDeleteNotice, useGetDashboard,
  useGetNotice, useListNotices,
} from '@workspace/api-client-react';
import type { Notice, NoticeDetail } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  EXTRACTION_ERROR_MESSAGE,
  extractUploadedFile,
  validateExtractedText,
} from '@/lib/document-extraction';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Overview', icon: HomeIcon },
  { href: '/history', label: 'My notices', icon: History },
  { href: '/knowledge-base', label: 'Knowledge base', icon: BookOpen },
  { href: '/pricing', label: 'NoticeLens Plus', icon: Sparkles },
];

function Logo() {
  return <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark" aria-hidden="true" />NoticeLens</Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`side-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={16} strokeWidth={1.7} /> <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <LockKeyhole size={14} />
          <div style={{ marginTop: 9 }}>Private by design.<br />Your notices stay yours.</div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span className="eyebrow">{location === '/' ? 'Private workspace' : 'NoticeLens'}</span>
          <div className="top-action"><span>Indian tax notices, made clear</span><span className="avatar" data-testid="avatar-user">AK</span></div>
        </header>
        {children}
        <nav className="mobile-bar" aria-label="Mobile navigation">
          {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={17} /><span>{label === 'My notices' ? 'Notices' : label === 'Knowledge base' ? 'Library' : label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return <div className="page"><div className="skeleton" style={{ height: 36, width: '38%', marginBottom: 24 }} /><div className="skeleton" style={{ height: 180, width: '100%', marginBottom: 12 }} /><div className="skeleton" style={{ height: 100, width: '100%' }} /><p className="eyebrow" style={{ marginTop: 17 }}>{label}</p></div>;
}

function ErrorState({ retry }: { retry?: () => void }) {
  return <div className="error-state" data-testid="state-error"><AlertCircle size={25} color="var(--coral)" /><h2>That did not load</h2><p>We could not reach your private workspace. Nothing has been changed.</p>{retry && <button className="btn btn-secondary" onClick={retry} data-testid="button-retry"><RefreshCcw size={14} /> Try again</button>}</div>;
}

function TaxBadge({ system }: { system: string }) {
  const income = system === 'INCOME_TAX';
  return <span className={`badge ${income ? 'badge-income' : 'badge-gst'}`}>{income ? 'Income Tax' : system === 'GST' ? 'GST' : 'Tax notice'}</span>;
}

function NoticeRow({ notice, onDelete }: { notice: Notice; onDelete?: (id: number) => void }) {
   const [location, setLocation] = useLocation();
  return (
    <div className="card notice-row" data-testid={`row-notice-${notice.id}`}>
      <div onClick={() => setLocation(`/notice/${notice.id}`)} style={{ cursor: 'pointer' }}>
        <div className="notice-name">{notice.title || notice.fileName}</div>
        <div className="notice-meta">{notice.fileName} · {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>
      <TaxBadge system={notice.taxSystem} />
      <div className={notice.deadline ? 'deadline' : 'notice-meta'}>{notice.deadline ? `Due ${notice.deadline}` : notice.status === 'analyzed' ? 'Analysed' : 'Processing'}</div>
      {onDelete && <button className="btn btn-quiet" style={{ padding: 8 }} onClick={() => onDelete(notice.id)} aria-label={`Delete ${notice.title}`} data-testid={`button-delete-notice-${notice.id}`}><Trash2 size={14} /></button>}
    </div>
  );
}

function Home() {
  const { data: dashboard, isLoading, isError, refetch } = useGetDashboard();
  if (isLoading) return <LoadingState label="Preparing your overview" />;
  if (isError) return <div className="page"><ErrorState retry={() => void refetch()} /></div>;
  const recent = dashboard?.recent ?? [];
  return (
    <main className="page" data-testid="page-overview">
      <div className="eyebrow">Good morning, Aditi</div>
      <div className="hero-grid">
        <section className="card hero-panel">
          <div className="eyebrow" style={{ color: '#a8c4b9' }}>Your notice companion</div>
          <h1 className="hero-title">From official <em>language</em> to a next step.</h1>
          <p className="hero-sub">Upload a GST or Income Tax notice. NoticeLens highlights the deadline, explains the request, and keeps every answer grounded in the notice and our reference library.</p>
          <div className="hero-actions">
            <Link href="/upload" className="btn btn-primary" data-testid="button-upload-notice"><UploadCloud size={16} /> Upload your notice</Link>
            <Link href="/demo" className="btn btn-secondary" data-testid="button-see-demo"><FileCheck2 size={15} /> See a demo</Link>
          </div>
        </section>
        <section className="card welcome-card">
          <div><div className="eyebrow">A calmer way through</div><h2>Clarity before you respond.</h2></div>
          <div><div className="quiet-rule" /><p>NoticeLens is not a lawyer or a chatbot. It is a careful reading layer for the document in front of you.</p></div>
          <Link href="/knowledge-base" className="text-button" data-testid="link-learn-grounding">How our explanations are grounded <ArrowRight size={13} style={{ verticalAlign: 'middle' }} /></Link>
        </section>
      </div>
      <div className="stats-grid">
        {([
          ['All notices', dashboard?.totalNotices ?? 0, FileText],
          ['Analysed', dashboard?.analyzedNotices ?? 0, Check],
          ['GST', dashboard?.gstNotices ?? 0, Zap],
          ['Income Tax', dashboard?.incomeTaxNotices ?? 0, FileCheck2],
        ] as const).map(([label, value, Icon]) => <div className="card stat" key={String(label)} data-testid={`stat-${String(label).toLowerCase().replace(' ', '-')}`}><Icon size={15} color="var(--teal)" /><div className="stat-number">{String(value)}</div><div className="stat-label">{String(label)}</div></div>)}
      </div>
      <div className="section-head"><h2>Recent notices</h2><Link href="/history" className="text-button" data-testid="link-view-all-notices">View all <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></Link></div>
      {recent.length ? <div className="notice-list">{recent.slice(0, 4).map((notice) => <NoticeRow key={notice.id} notice={notice} />)}</div> : <div className="card empty" data-testid="empty-recent-notices"><div className="empty-icon"><FileText size={20} /></div><h3>Your first notice goes here</h3><p>Upload a document and we will turn its official language into a clear, structured brief.</p><Link href="/upload" className="btn btn-primary" data-testid="button-empty-upload"><Plus size={15} /> Upload a notice</Link></div>}
    </main>
  );
}

function UploadPage() {
  const [, setLocation] = useLocation();
  const createNotice = useCreateNotice();
  const [file, setFile] = useState<File | null>(null);
  const [system, setSystem] = useState<'GST' | 'INCOME_TAX' | 'NOT_SURE'>('NOT_SURE');
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    const extension = next.name.toLowerCase().split('.').pop();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension ?? '') || next.size > 10 * 1024 * 1024) return;
    setFile(next);
    if (!title) setTitle(next.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
  };
  const submit = async () => {
    if (!file || !title.trim()) return;
    setIsExtracting(true);
    setExtractionError('');
    try {
      const extractedText = validateExtractedText(await extractUploadedFile(file));
      if (!extractedText) throw new Error(EXTRACTION_ERROR_MESSAGE);
      createNotice.mutate({ data: { title: title.trim(), fileName: file.name, fileType: file.type || 'application/octet-stream', taxSystem: system, content: extractedText } }, {
        onSuccess: (notice) => {
          localStorage.setItem(`notice-content-${notice.id}`, extractedText);
          setLocation(`/processing?noticeId=${notice.id}`);
        },
      });
    } catch {
      setExtractionError(EXTRACTION_ERROR_MESSAGE);
    } finally {
      setIsExtracting(false);
    }
  };
  return (
    <main className="page" data-testid="page-upload">
      <div className="page-head"><div><div className="eyebrow">Step 01 / Add a document</div><h1 className="page-title">Let’s make this<br /><span className="serif">readable.</span></h1><p className="page-copy">Your original file is used only to understand this notice. Select the tax system if you know it; “Not sure” is a perfectly good answer.</p></div><Link href="/" className="btn btn-quiet" data-testid="button-cancel-upload"><ArrowLeft size={15} /> Back</Link></div>
      <div className="card split-card">
        <aside className="split-aside"><div className="eyebrow" style={{ color: '#9dbab0' }}>What happens next</div><h2>Three quiet steps.</h2><p>No dense report. No invented advice. Just the important parts, in order.</p><div className="step-list"><div className="step"><span className="step-no">01</span><span><b>Read</b><br />We extract the document’s own signals.</span></div><div className="step"><span className="step-no">02</span><span><b>Organise</b><br />Deadline, request, amount and section.</span></div><div className="step"><span className="step-no">03</span><span><b>Explain</b><br />Clear context, grounded in our library.</span></div></div></aside>
        <section className="upload-main">
          <div className="field"><label className="field-label" htmlFor="notice-title">A name for this notice</label><input id="notice-title" className="text-input" placeholder="e.g. GST notice — March 2024" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-notice-title" /></div>
          <div className="field"><span className="field-label">Which system is it from?</span><div className="system-options">{[['GST', 'GST'], ['INCOME_TAX', 'Income Tax'], ['NOT_SURE', 'Not sure']].map(([value, label]) => <button type="button" key={value} className={`system-option ${system === value ? 'selected' : ''}`} onClick={() => setSystem(value as typeof system)} data-testid={`button-tax-system-${value.toLowerCase()}`}>{label}<br /><small>{value === 'GST' ? 'Goods & Services Tax' : value === 'INCOME_TAX' ? 'Direct tax notices' : 'We’ll help identify it'}</small></button>)}</div></div>
          <div className="field"><span className="field-label">Upload the notice</span><div className={`drop-zone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files[0]); }} data-testid="dropzone-notice-file"><UploadCloud size={25} /><strong>Drop your notice here</strong><span>PDF, JPG, JPEG or PNG · Keep it under 10 MB</span><input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden onChange={(e) => chooseFile(e.target.files?.[0])} data-testid="input-notice-file" /></div>{file && <div className="file-chip" data-testid="selected-file"><span><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} />{file.name}</span><button onClick={() => setFile(null)} aria-label="Remove selected file" data-testid="button-remove-file"><X size={14} /></button></div>} {!file && <p className="price-note">Only PDF, JPG, JPEG and PNG files under 10 MB are accepted.</p>}</div>
          {(createNotice.isError || extractionError) && <div className="config-state" data-testid={extractionError ? 'extraction-error' : 'upload-error'}>{extractionError || 'We couldn’t save this notice. Please try again.'}</div>}
          <button className="btn btn-primary btn-wide" onClick={() => void submit()} disabled={!file || !title.trim() || createNotice.isPending || isExtracting} data-testid="button-start-analysis">{isExtracting ? <><LoaderCircle size={15} className="spin" /> Reading document…</> : createNotice.isPending ? <><LoaderCircle size={15} className="spin" /> Saving notice…</> : <>Continue to analysis <ArrowRight size={15} /></>}</button>
          <p className="price-note" style={{ textAlign: 'center' }}><LockKeyhole size={12} style={{ verticalAlign: 'middle' }} /> Private workspace · We never share your documents</p>
        </section>
      </div>
    </main>
  );
}

function ProcessingPage() {
  const [, setLocation] = useLocation();
  const analyze = useAnalyzeNotice();
  const query = new URLSearchParams(window.location.search);
  const noticeId = Number(query.get('noticeId'));
  useEffect(() => {
    if (!noticeId || analyze.isPending || analyze.isSuccess) return;
    const content = localStorage.getItem(`notice-content-${noticeId}`) ?? undefined;
    analyze.mutate({ noticeId, data: { content } }, {
      onSuccess: () => setTimeout(() => setLocation(`/notice/${noticeId}`), 700),
    });
  }, [noticeId, analyze.isPending, analyze.isSuccess, setLocation]);
  return <main className="page" data-testid="page-processing"><div className="processing"><div className="processing-mark"><FileCheck2 size={32} /></div><div className="eyebrow">Step 02 / Reading your notice</div><h1>Finding the signal<br /><span className="serif">inside the paperwork.</span></h1><p>We’re looking for dates, amounts, sections and the exact action the department is asking for.</p><div className="progress-track"><div className="progress-bar" /></div><div className="processing-note">{analyze.isError ? 'Could not finish reading this document.' : 'This usually takes a few seconds · no legal conclusions are made'}</div>{analyze.isError && <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => analyze.reset()} data-testid="button-retry-analysis"><RefreshCcw size={14} /> Try again</button>}</div></main>;
}

function ExtractedCard({ detail }: { detail: NoticeDetail }) {
  const extracted = detail.analysis?.extracted;
  if (!extracted) return null;
  const values = [['Department', extracted.department], ['Reference no.', extracted.referenceNumber], ['Notice date', extracted.noticeDate], ['Financial year', extracted.financialYear], ['Assessment year', extracted.assessmentYear], ['Tax period', extracted.taxPeriod], ['Section', extracted.section], ['Hearing date', extracted.hearingDate]];
  return <div className="card extract-card" data-testid="card-extracted-details"><h2>What we found in the notice</h2><dl className="extract-grid">{values.map(([label, value]) => <div className="extract-item" key={label}><dt>{label}</dt><dd>{value || 'Not found in the notice.'}</dd></div>)}<div className="extract-item important"><dt>Deadline</dt><dd>{extracted.deadline || 'Not found in the notice.'}</dd></div><div className="extract-item important"><dt>Action requested</dt><dd>{extracted.requestedAction || 'Not found in the notice.'}</dd></div></dl>{extracted.amounts?.length > 0 && <><div className="quiet-rule" /><div className="eyebrow">Amounts mentioned</div><div style={{ marginTop: 7, fontSize: 13 }}>{extracted.amounts.join(' · ')}</div></>}{extracted.documents?.length > 0 && <><div className="quiet-rule" /><div className="eyebrow">Documents to keep ready</div><ul className="bullet-list" style={{ marginBottom: 0 }}>{extracted.documents.map((document) => <li key={document}>{document}</li>)}</ul></>}</div>;
}

function AskCard({ noticeId }: { noticeId: number }) {
  return <section className="ask-card" data-testid="card-ask-notice"><MessageCircle size={19} color="#f0c99e" /><h2>Ask my notice</h2><p>Open a dedicated page to ask about this document.</p><Link href={`/notice/${noticeId}/ask`} className="btn btn-secondary" data-testid="button-open-ask-notice">Ask a question <ArrowRight size={15} /></Link></section>;
}

function AskNoticePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: detail, isLoading, isError, refetch } = useGetNotice(id, { query: { enabled: !!id, queryKey: getGetNoticeQueryKey(id) } });
  const ask = useAskNotice();
  const [question, setQuestion] = useState('');
  const suggestions = ['What do I need to submit?', 'When is my response due?', 'What amount is mentioned?'];
  const submit = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    ask.mutate({ noticeId: id, data: { question: trimmed } });
  };
  if (isLoading) return <LoadingState label="Opening Ask My Notice" />;
  if (isError || !detail) return <div className="page"><ErrorState retry={() => void refetch()} /></div>;
  return <main className="page" data-testid={`page-ask-notice-${id}`}><div className="page-head"><div><div className="eyebrow">Ask My Notice</div><h1 className="page-title">A clear answer<br /><span className="serif">about this notice.</span></h1><p className="page-copy">{detail.title} · Ask about the deadline, documents, amount, section or next step.</p></div><Link href={`/notice/${id}`} className="btn btn-quiet" data-testid="button-back-to-notice"><ArrowLeft size={15} /> Back to notice</Link></div><section className="card ask-page-card"><MessageCircle size={25} color="#f0c99e" /><h2>What would you like to know?</h2><p>Answers are limited to the uploaded notice and the supplied NoticeLens Knowledge Base. NoticeLens will say when there is not enough information.</p><div className="ask-input-wrap"><input autoFocus className="text-input" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="Write your question" maxLength={500} data-testid="input-ask-notice-page" /><button className="btn btn-primary" onClick={() => submit()} disabled={!question.trim() || ask.isPending} data-testid="button-ask-notice-page">{ask.isPending ? <LoaderCircle size={15} className="spin" /> : <>Ask <ArrowRight size={15} /></>}</button></div><div className="suggestions">{suggestions.map((suggestion) => <button className="suggestion" key={suggestion} onClick={() => submit(suggestion)} data-testid={`button-ask-suggestion-${suggestion.slice(0, 10).replaceAll(' ', '-').toLowerCase()}`}>{suggestion}</button>)}</div>{ask.isError && <div className="answer" data-testid="answer-notice-error">I don't have enough information in this notice and the NoticeLens Knowledge Base to answer that reliably.</div>}{ask.data && <div className="answer" data-testid="answer-notice"><b>{ask.data.answer}</b></div>}</section></main>;
}

function NoticePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: detail, isLoading, isError, refetch } = useGetNotice(id, { query: { enabled: !!id, queryKey: getGetNoticeQueryKey(id) } });
  const [, setLocation] = useLocation();
  if (isLoading) return <LoadingState label="Opening your notice" />;
  if (isError || !detail) return <div className="page"><ErrorState retry={() => void refetch()} /></div>;
  const analysis = detail.analysis;
  return <main className="page" data-testid={`page-notice-${id}`}><div className="detail-head"><div><div className="eyebrow"><TaxBadge system={detail.taxSystem} /> <span style={{ marginLeft: 7 }}>{detail.isDemo ? 'Fictional example' : 'Private notice'}</span></div><h1 className="detail-title">{detail.title}</h1><div className="notice-meta">{detail.fileName} · Added {new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div><div className="detail-actions"><button className="btn btn-quiet" onClick={() => setLocation('/history')} data-testid="button-back-history"><ArrowLeft size={14} /> Back</button><button className="btn btn-secondary" onClick={() => window.print()} data-testid="button-print-notice"><FileText size={14} /> Save brief</button></div></div>{analysis ? <><div className="alert-deadline" data-testid="alert-notice-deadline"><Clock3 size={28} /><div><strong>Response deadline</strong><p>Keep this date visible before you plan your next step.</p></div><div className="deadline-date">{analysis.extracted.deadline || detail.deadline || 'Not found in the notice.'}</div></div><div className="analysis-grid"><div>{analysis.sections.map((section) => <section className={`card analysis-section tone-${section.tone}`} key={section.key} data-testid={`section-analysis-${section.key}`}><div className="eyebrow">{section.key.replaceAll('-', ' ')}</div><h2>{section.title}</h2><p>{section.body}</p>{section.bullets?.length ? <ul className="bullet-list">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}<AskCard noticeId={id} /></div><div><ExtractedCard detail={detail} /><div className="card terms-card" data-testid="card-terms"><h2>Terms, in plain language</h2>{analysis.terms.map((term) => <div className="term" key={term.term}><strong>{term.term}</strong><p>{term.explanation}</p></div>)}</div></div></div></> : <div className="card empty"><div className="empty-icon"><Info size={20} /></div><h3>Analysis is not ready yet</h3><p>This notice is saved. Return shortly to see its structured brief.</p><Link href={`/processing?noticeId=${id}`} className="btn btn-primary" data-testid="button-analyze-notice"><Sparkles size={15} /> Analyse notice</Link></div>}</main>;
}

function HistoryPage() {
  const { data: notices, isLoading, isError, refetch } = useListNotices();
  const deleteNotice = useDeleteNotice();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  if (isLoading) return <LoadingState label="Loading saved notices" />;
  if (isError) return <div className="page"><ErrorState retry={() => void refetch()} /></div>;
  const filtered = (notices ?? []).filter((notice) => `${notice.title} ${notice.fileName} ${notice.noticeType ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const remove = (id: number) => { if (window.confirm('Delete this saved notice? This cannot be undone.')) deleteNotice.mutate({ noticeId: id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } }); };
  return <main className="page" data-testid="page-history"><div className="page-head"><div><div className="eyebrow">Private archive</div><h1 className="page-title">Your notices.</h1><p className="page-copy">Everything you have uploaded, kept in one place. Reopen a brief or remove a document when you no longer need it.</p></div><Link href="/upload" className="btn btn-primary" data-testid="button-history-upload"><Plus size={15} /> Upload notice</Link></div><div className="history-toolbar"><div style={{ position: 'relative', flex: 1 }}><Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 12 }} /><input className="text-input" style={{ paddingLeft: 35 }} placeholder="Search your notices" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-notices" /></div><span className="eyebrow">{filtered.length} saved</span></div>{filtered.length ? <div className="notice-list">{filtered.map((notice) => <NoticeRow key={notice.id} notice={notice} onDelete={remove} />)}</div> : <div className="card empty" data-testid="empty-history"><div className="empty-icon"><History size={20} /></div><h3>{search ? 'No notices match that search' : 'Your archive is empty'}</h3><p>{search ? 'Try a different title or file name.' : 'Upload your first notice to create a clear, private brief.'}</p>{!search && <Link href="/upload" className="btn btn-primary" data-testid="button-empty-history-upload"><UploadCloud size={15} /> Upload a notice</Link>}</div>}</main>;
}

function DemoPage() {
  const [, setLocation] = useLocation();
  const createNotice = useCreateNotice();
  const demos = [
    { tax: 'GST' as const, label: 'GST ASMT-10', title: 'GST discrepancy notice', desc: 'A fictional scrutiny notice about a mismatch between outward supplies and returns.', content: 'DEMO — FICTIONAL DATA. GST ASMT-10 notice from the Goods and Services Tax Department. The registered person is asked to explain a discrepancy in outward supplies for FY 2023-24. Submit a response within 30 days of service.' },
    { tax: 'GST' as const, label: 'GST DRC-01', title: 'GST demand proceeding', desc: 'A fictional show-cause proceeding with tax, interest and penalty amounts.', content: 'DEMO — FICTIONAL DATA. GST DRC-01 show-cause notice from the Goods and Services Tax Department. Reference no.: GST/DEMO/2024/002. Tax period: April 2024 - June 2024. Section 73. Tax: ₹24,000. Interest: ₹1,800. Penalty: ₹2,400. Reply by 15/08/2024. The registered person may submit an explanation and request a hearing.' },
    { tax: 'INCOME_TAX' as const, label: 'Income Tax 142(1)', title: 'Income Tax information request', desc: 'A fictional request for supporting documents during assessment proceedings.', content: 'DEMO — FICTIONAL DATA. Income Tax Department notice under section 142(1) for Assessment Year 2024-25. Reference no.: IT/DEMO/2024/003. Reply by 20/08/2024. The taxpayer is asked to upload bank statements, salary or income reconciliation, and deduction evidence through the e-Proceedings portal.' },
  ];
  const openDemo = (demo: typeof demos[number]) => createNotice.mutate({ data: { title: demo.title, fileName: `${demo.label.toLowerCase().replaceAll(' ', '-')}.txt`, fileType: 'text/plain', taxSystem: demo.tax, content: demo.content, isDemo: true } }, { onSuccess: (notice) => { localStorage.setItem(`notice-content-${notice.id}`, demo.content); setLocation(`/processing?noticeId=${notice.id}`); } });
  return <main className="page" data-testid="page-demo"><div className="page-head"><div><div className="eyebrow">Step 00 / Explore NoticeLens</div><h1 className="page-title">Choose a fictional<br /><span className="serif">notice to explore.</span></h1><p className="page-copy">These examples are invented for demonstration. They are not tax advice and have no legal effect.</p></div><Link href="/" className="btn btn-quiet" data-testid="button-back-demo"><ArrowLeft size={15} /> Back</Link></div><div className="demo-grid">{demos.map((demo, index) => <article className="card demo-card" key={demo.label} data-testid={`card-demo-${index}`}><div className="demo-tag">{demo.label} · Fictional</div><h2>{demo.title}</h2><p>{demo.desc}</p><button className="btn btn-secondary" onClick={() => openDemo(demo)} disabled={createNotice.isPending} data-testid={`button-open-demo-${index}`}>Explore this notice <ArrowRight size={14} /></button></article>)}</div></main>;
}

function KnowledgePage() {
  const entries = [
    ['01 / Source', 'Deterministic reference library', 'NoticeLens uses the supplied reference library as its source for tax concepts and explanations. It does not browse the web or improvise a new rule.'],
    ['02 / Reading', 'What “not found” means', 'If a date, amount, section or document is absent from the uploaded notice, we say “Not found in the notice.” We do not fill gaps with assumptions.'],
    ['03 / Answers', 'A grounded conversation', 'Ask My Notice can answer questions about your document when the notice and reference library contain enough information. Otherwise it says: “I don’t have enough information in this notice and the NoticeLens Knowledge Base to answer that reliably.”'],
    ['04 / Boundaries', 'A reading layer, not representation', 'NoticeLens helps you understand what a notice says and what it asks for. It is not a lawyer, tax practitioner, or substitute for professional advice.'],
  ];
  return <main className="page" data-testid="page-knowledge-base"><div className="page-head"><div><div className="eyebrow">The NoticeLens method</div><h1 className="page-title">A small library<br /><span className="serif">with firm edges.</span></h1><p className="page-copy">Good explanations begin with knowing what you can and cannot claim. This is the reference layer behind every NoticeLens brief.</p></div></div><div className="kb-grid"><aside className="card kb-intro"><ShieldCheck size={23} color="#f0c99e" /><h2>Grounded,<br />not generic.</h2><p>The supplied knowledge base is deterministic. That makes our language narrower, but much more trustworthy when a notice is stressful and time is short.</p><div className="quiet-rule" style={{ background: 'rgba(255,255,255,.18)' }} /><div className="eyebrow" style={{ color: '#a8c4b9' }}>Reference library</div></aside><section className="card kb-list">{entries.map(([number, title, body]) => <article className="kb-item" key={number} data-testid={`kb-entry-${number.slice(0, 2)}`}><div className="eyebrow">{number}</div><h3>{title}</h3><p>{body}</p></article>)}</section></div></main>;
}

function PricingPage() {
  const key = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined;
  const [offering, setOffering] = useState<Package | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'purchasing' | 'restoring' | 'success' | 'error'>('idle');
  const [isPlus, setIsPlus] = useState(false);
  const purchasesRef = useRef<Purchases | null>(null);
  useEffect(() => {
    if (!key) return;
    setState('loading');
    try {
      const appUserId = localStorage.getItem('notice_lens_rc_user') ?? crypto.randomUUID();
      localStorage.setItem('notice_lens_rc_user', appUserId);
      const purchases = Purchases.isConfigured()
        ? Purchases.getSharedInstance()
        : Purchases.configure({ apiKey: key, appUserId });
      purchasesRef.current = purchases;
      void Promise.all([purchases.getOfferings(), purchases.isEntitledTo('notice_lens_plus')])
        .then(([offerings, entitled]) => {
          const current = offerings.current;
          const selected = current?.availablePackages.find(
            (pkg) => pkg.webBillingProduct.identifier === 'notice_lens_plus_monthly',
          ) ?? current?.monthly ?? current?.availablePackages[0] ?? null;
          setOffering(selected);
          setIsPlus(entitled);
          setState('idle');
        })
        .catch(() => setState('error'));
    } catch {
      setState('error');
    }
  }, [key]);
  const purchase = async () => {
    const purchases = purchasesRef.current;
    if (!purchases || !offering) return;
    setState('purchasing');
    try {
      await purchases.purchase({ rcPackage: offering });
      const customerInfo = await purchases.getCustomerInfo();
      setIsPlus(customerInfo.entitlements.active['notice_lens_plus'] !== undefined);
      setState('success');
    } catch {
      setState('error');
    }
  };
  const restore = async () => {
    const purchases = purchasesRef.current;
    if (!purchases) return;
    setState('restoring');
    try {
      const customerInfo = await purchases.getCustomerInfo();
      setIsPlus(customerInfo.entitlements.active['notice_lens_plus'] !== undefined);
      setState('success');
    } catch {
      setState('error');
    }
  };
  const missing = !key;
  return <main className="page" data-testid="page-pricing"><div className="page-head"><div><div className="eyebrow">A little more room</div><h1 className="page-title">Meet NoticeLens<br /><span className="serif">Plus.</span></h1><p className="page-copy">For people who regularly receive notices and want a deeper, quieter workspace.</p></div></div><div className="price-grid"><section className="card price-card"><div className="eyebrow">Free · always</div><h2>NoticeLens</h2><div className="price">₹0 <small>forever</small></div><ul className="feature-list"><li><Check size={15} /> Understand one notice at a time</li><li><Check size={15} /> Structured deadlines and next steps</li><li><Check size={15} /> Grounded Ask My Notice</li><li><Check size={15} /> Private notice history</li></ul><button className="btn btn-quiet btn-wide" disabled data-testid="button-current-plan">Current plan</button></section><section className="card price-card plus"><div className="eyebrow" style={{ color: '#bcd0c7' }}>For a fuller archive</div><h2>NoticeLens Plus</h2><div className="price">{offering?.webBillingProduct.price.formattedPrice ?? 'Price from RevenueCat'} <small>/ month</small></div>{missing ? <div className="config-state" data-testid="status-revenuecat-config">RevenueCat is not configured yet. Add <b>VITE_REVENUECAT_PUBLIC_KEY</b> to load the live offering price. Premium access stays locked until the purchase service is connected.</div> : !offering && state !== 'error' ? <div className="config-state" data-testid="status-revenuecat-loading">Loading the current RevenueCat offering…</div> : state === 'error' ? <div className="config-state" data-testid="status-revenuecat-error">RevenueCat could not load this offering. Check the configuration and try again.</div> : null}{isPlus && <div className="config-state" data-testid="status-plus-active">NoticeLens Plus is active for this customer.</div>}<ul className="feature-list"><li><Check size={15} /> Unlimited saved notice briefs</li><li><Check size={15} /> A longer private archive</li><li><Check size={15} /> Priority analysis queue</li></ul><button className="btn btn-primary btn-wide" onClick={() => void purchase()} disabled={!offering || state === 'purchasing' || state === 'loading' || isPlus} data-testid="button-purchase-plus">{state === 'purchasing' ? <><LoaderCircle size={15} /> Opening purchase…</> : isPlus ? <><Check size={15} /> Plus active</> : <><Sparkles size={15} /> Get Plus</>}</button><button className="text-button" style={{ color: '#f0c99e', width: '100%', marginTop: 12 }} onClick={() => void restore()} disabled={missing || !purchasesRef.current || state === 'restoring'} data-testid="button-restore-purchase">{state === 'restoring' ? 'Refreshing customer info…' : 'Restore a previous purchase'}</button>{state === 'success' && <div className="price-note" data-testid="status-purchase-success">{isPlus ? 'RevenueCat confirmed NoticeLens Plus access.' : 'RevenueCat refreshed this customer, but no active NoticeLens Plus entitlement was found.'}</div>}<div className="price-note">Prices are served by the current RevenueCat offering. NoticeLens never hardcodes or invents a price.</div></section></div></main>;
}

function Router() {
  return <ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/" component={Home} /><Route path="/upload" component={UploadPage} /><Route path="/processing" component={ProcessingPage} /><Route path="/notice/:id/ask" component={AskNoticePage} /><Route path="/notice/:id" component={NoticePage} /><Route path="/history" component={HistoryPage} /><Route path="/pricing" component={PricingPage} /><Route path="/knowledge-base" component={KnowledgePage} /><Route path="/demo" component={DemoPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Router /></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;