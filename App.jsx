import React, { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { toPng } from "html-to-image";
import {
  WandSparkles, Layers3, Type, Grid3X3, Download, Plus, Trash2, Copy,
  ChevronLeft, ChevronRight, Save, FolderOpen, ImagePlus, Sparkles,
  Settings2, Check, GripVertical, RefreshCw, Upload, X, Eye, FileText
} from "lucide-react";

const NICHES = [
  "Bisnis & Startup", "Teknologi & AI", "Fashion & Style",
  "Fitness & Health", "Keuangan & Investasi", "Kuliner & Lifestyle",
  "Self Growth & Quotes"
];

const STYLES = [
  { id:"bold", name:"Bold Glass Dark", bg:"#111827", card:"rgba(31,41,55,.88)", accent:"#a78bfa", text:"#f8fafc", muted:"#cbd5e1", font:"Impact, sans-serif" },
  { id:"luxury", name:"Minimalist Luxury", bg:"#f4efe7", card:"#fffaf2", accent:"#9b7546", text:"#25211d", muted:"#766d62", font:"Georgia, serif" },
  { id:"cyber", name:"Cyberpunk Neon", bg:"#09051b", card:"rgba(30,15,56,.9)", accent:"#f0abfc", text:"#fff7ff", muted:"#d8b4fe", font:"Arial, sans-serif" },
  { id:"nordic", name:"Nordic Emerald", bg:"#eaf3ef", card:"#ffffff", accent:"#087f5b", text:"#102a22", muted:"#527268", font:"Arial, sans-serif" },
  { id:"neo", name:"Neubrutalist Pop", bg:"#fff2cc", card:"#ffffff", accent:"#ff5b35", text:"#171717", muted:"#4b4b4b", font:"Arial Black, sans-serif" },
  { id:"y2k", name:"Y2K Sunset Glow", bg:"#281342", card:"rgba(77,36,99,.88)", accent:"#ff9acb", text:"#fff7fc", muted:"#f5c5e1", font:"Arial, sans-serif" }
];

const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const starterSlides = () => [
  { id:uid(), type:"hook", tag:"PANDUAN", headline:"JANGAN MULAI BISNIS SEBELUM TAHU INI", subtitle:"5 hal penting yang sering dilewatkan pemula.", points:[], ctaText:"" },
  { id:uid(), type:"content", tag:"01 — RISET", headline:"Kenali siapa calon pembelimu", subtitle:"Produk bagus tidak cukup jika tidak dibutuhkan pasar.", points:["Cari masalah yang nyata","Amati kompetitor","Validasi dengan calon pelanggan"], ctaText:"" },
  { id:uid(), type:"content", tag:"02 — MODAL", headline:"Mulai dari versi paling sederhana", subtitle:"Uji permintaan sebelum mengeluarkan modal besar.", points:["Buat penawaran sederhana","Catat semua biaya","Evaluasi hasil penjualan"], ctaText:"" },
  { id:uid(), type:"content", tag:"03 — KONSISTEN", headline:"Bangun sistem, bukan sekadar semangat", subtitle:"Rutinitas kecil membuat bisnis lebih terukur.", points:["Tetapkan target mingguan","Ukur hasil","Perbaiki proses"], ctaText:"" },
  { id:uid(), type:"cta", tag:"SIMPAN & BAGIKAN", headline:"Siap mulai langkah pertamamu?", subtitle:"Ikuti akun ini untuk insight bisnis yang praktis.", points:[], ctaText:"FOLLOW UNTUK TIPS LAINNYA" }
];

const defaultProject = () => ({
  id:uid(), name:"Proyek Tanpa Judul", updatedAt:Date.now(),
  brand:{ username:"@magicfeed.studio", verified:true, avatar:"", showBrand:true },
  ratio:"4:5", style:"bold", niche:NICHES[0], fontSize:28,
  slides:starterSlides(), caption:"", grid:Array(9).fill(null)
});

const DB_NAME = "magicfeed-maker-db";
function openDB() {
  return new Promise((resolve,reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("projects", {keyPath:"id"});
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbAll() {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const req = db.transaction("projects").objectStore("projects").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(project) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction("projects","readwrite");
    tx.objectStore("projects").put({...project, updatedAt:Date.now()});
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction("projects","readwrite");
    tx.objectStore("projects").delete(id);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
}
const fileToData = file => new Promise((resolve,reject) => {
  const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
});

function SlideCanvas({slide, project, preview=false}) {
  const style = STYLES.find(s=>s.id===project.style) || STYLES[0];
  const isPortrait = project.ratio === "4:5";
  const fontSize = Math.max(18, Math.min(54, project.fontSize * (preview ? 1.15 : 1.8)));
  return <div className={`slide-art ${preview ? "preview-art" : ""}`} style={{
    aspectRatio:isPortrait ? "4 / 5" : "1 / 1", background:style.bg, color:style.text,
    fontFamily:style.font, "--accent":style.accent, "--muted":style.muted, "--card":style.card
  }}>
    <div className="art-orb orb-one"></div><div className="art-orb orb-two"></div>
    <div className="art-topline"><span className="art-tag">{slide.tag || "MAGICFEED"}</span><span className="art-count">{slide.type==="hook"?"01":slide.type==="cta"?"05":"✦"}</span></div>
    <div className="art-content">
      <div className="art-eyebrow">{slide.type==="hook"?"SWIPE UNTUK MEMBACA":slide.type==="cta"?"JANGAN BERHENTI DI SINI":"INSIGHT & STRATEGI"}</div>
      <h2 style={{fontSize:`${fontSize}px`}}>{slide.headline || "Judul slide kamu"}</h2>
      {slide.subtitle && <p className="art-subtitle">{slide.subtitle}</p>}
      {!!slide.points?.length && <div className="art-points">{slide.points.filter(Boolean).map((p,i)=><div className="art-point" key={i}><b>{String(i+1).padStart(2,"0")}</b><span>{p}</span></div>)}</div>}
      {slide.ctaText && <div className="art-cta">{slide.ctaText}</div>}
    </div>
    {project.brand.showBrand && <div className="art-footer">
      {project.brand.avatar ? <img src={project.brand.avatar} /> : <span className="avatar-fallback">{(project.brand.username||"M").replace("@","").slice(0,1).toUpperCase()}</span>}
      <span>{project.brand.username}</span>{project.brand.verified && <span className="verified">✓</span>}
      <span className="footer-mark">✦</span>
    </div>}
  </div>;
}

export default function App() {
  const [project,setProject] = useState(defaultProject);
  const [active,setActive] = useState(0);
  const [tab,setTab] = useState("editor");
  const [projects,setProjects] = useState([]);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [topic,setTopic] = useState("");
  const [slideCount,setSlideCount] = useState(5);
  const [workerUrl,setWorkerUrl] = useState(localStorage.getItem("magicfeed_worker_url") || "");
  const [reference,setReference] = useState("");
  const [refOpacity,setRefOpacity] = useState(.45);
  const [refBlur,setRefBlur] = useState(0);
  const [dragIndex,setDragIndex] = useState(null);
  const [selectedGrid,setSelectedGrid] = useState(0);
  const stageRef = useRef(null);
  const avatarInput = useRef(null);
  const refInput = useRef(null);
  const current = project.slides[active] || project.slides[0];
  const style = STYLES.find(s=>s.id===project.style) || STYLES[0];

  useEffect(()=>{ refreshProjects(); },[]);
  useEffect(()=>{ if(notice){const t=setTimeout(()=>setNotice(""),3500);return ()=>clearTimeout(t);} },[notice]);
  const updateProject = patch => setProject(p=>({...p,...patch}));
  const updateSlide = patch => setProject(p=>({...p,slides:p.slides.map((s,i)=>i===active?{...s,...patch}:s)}));
  const refreshProjects = async()=>{try{setProjects((await dbAll()).sort((a,b)=>b.updatedAt-a.updatedAt));}catch(e){setNotice("Browser tidak mendukung penyimpanan lokal.");}};
  const saveProject = async()=>{try{await dbPut(project);await refreshProjects();setNotice("Proyek berhasil disimpan di perangkat ini.");}catch(e){setNotice("Gagal menyimpan proyek: "+e.message);}};
  const newProject = ()=>{if(!confirm("Buat proyek baru? Pastikan proyek sekarang sudah disimpan."))return;setProject(defaultProject());setActive(0);setReference("");setTab("editor");};
  const loadProject = p=>{setProject(p);setActive(0);setTab("editor");setNotice("Proyek dibuka.");};
  const deleteProject = async id=>{if(!confirm("Hapus proyek ini dari perangkat?"))return;await dbDelete(id);refreshProjects();};
  const addSlide = ()=>{if(project.slides.length>=10){setNotice("Maksimal 10 slide.");return;}const s={id:uid(),type:"content",tag:`0${project.slides.length} — POIN`,headline:"Tulis judul slide",subtitle:"Tambahkan penjelasan singkat.",points:["Poin pertama"],ctaText:""};setProject(p=>({...p,slides:[...p.slides,s]}));setActive(project.slides.length);};
  const deleteSlide = ()=>{if(project.slides.length<=1){setNotice("Minimal harus ada 1 slide.");return;}if(!confirm("Hapus slide ini?"))return;setProject(p=>({...p,slides:p.slides.filter((_,i)=>i!==active)}));setActive(Math.max(0,active-1));};
  const duplicateSlide = ()=>{if(project.slides.length>=10){setNotice("Maksimal 10 slide.");return;}const copy={...current,id:uid(),points:[...(current.points||[])]};setProject(p=>({...p,slides:[...p.slides.slice(0,active+1),copy,...p.slides.slice(active+1)]}));setActive(active+1);};
  const moveSlide = (from,to)=>{if(to<0||to>=project.slides.length)return;const arr=[...project.slides];const [item]=arr.splice(from,1);arr.splice(to,0,item);setProject(p=>({...p,slides:arr}));setActive(to);};
  const addPoint = ()=>{if((current.points||[]).length>=5){setNotice("Maksimal 5 poin per slide.");return;}updateSlide({points:[...(current.points||[]),"Poin baru"]});};
  const changePoint = (idx,value)=>updateSlide({points:current.points.map((p,i)=>i===idx?value:p)});
  const removePoint = idx=>updateSlide({points:current.points.filter((_,i)=>i!==idx)});

  const generateAI = async()=>{
    if(!topic.trim()){setNotice("Masukkan topik atau ide carousel terlebih dahulu.");return;}
    if(!workerUrl.trim()){setNotice("Isi URL Cloudflare Worker pada Pengaturan AI terlebih dahulu.");setTab("settings");return;}
    setBusy(true);setNotice("AI sedang menyusun carousel…");
    try{
      localStorage.setItem("magicfeed_worker_url",workerUrl.trim());
      let imageData=null;
      if(reference){const [meta,data]=reference.split(",");imageData={mimeType:meta.match(/data:(.*?);/)?.[1]||"image/png",data};}
      const res=await fetch(workerUrl.trim(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        topic,niche:project.niche,slideCount,style:STYLES.find(s=>s.id===project.style)?.name||"Bold Glass Dark",
        referenceImage:imageData
      })});
      const json=await res.json();
      if(!res.ok)throw new Error(json.error||`Worker error ${res.status}`);
      const slides=(json.slides||[]).slice(0,10).map((s,i)=>({
        id:uid(),type:i===0?"hook":i===(json.slides.length-1)?"cta":"content",
        tag:s.tag||`0${i+1}`,headline:s.headline||"Judul slide",subtitle:s.subtitle||"",
        points:Array.isArray(s.points)?s.points.slice(0,5):[],ctaText:s.ctaText||""
      }));
      if(!slides.length)throw new Error("AI tidak mengembalikan slide. Coba prompt lain.");
      setProject(p=>({...p,slides,caption:json.caption||"",niche:project.niche}));
      setActive(0);setTab("editor");setNotice(`Berhasil membuat ${slides.length} slide dengan AI.`);
    }catch(e){setNotice("Gagal membuat konten AI: "+e.message);}
    finally{setBusy(false);}
  };

  const exportOne = async()=>{
    if(!stageRef.current)return;
    try{setBusy(true);const data=await toPng(stageRef.current,{pixelRatio:3,cacheBust:true});const a=document.createElement("a");a.href=data;a.download=`magicfeed-slide-${active+1}.png`;a.click();setNotice("Slide PNG berhasil diekspor.");}
    catch(e){setNotice("Ekspor gagal: "+e.message);}finally{setBusy(false);}
  };
  const exportAll = async()=>{
    if(!stageRef.current)return;
    setBusy(true);
    try{
      const zip=new JSZip();const old=active;
      for(let i=0;i<project.slides.length;i++){
        setActive(i);
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const node=stageRef.current;
        const data=await toPng(node,{pixelRatio:3,cacheBust:true});
        zip.file(`slide-${String(i+1).padStart(2,"0")}.png`,data.split(",")[1],{base64:true});
      }
      setActive(old);
      const blob=await zip.generateAsync({type:"blob"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="magicfeed-carousel.zip";a.click();URL.revokeObjectURL(url);setNotice("Semua slide berhasil diekspor ke ZIP.");
    }catch(e){setNotice("Ekspor ZIP gagal: "+e.message);}finally{setBusy(false);}
  };
  const uploadAvatar = async e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")){setNotice("Pilih file gambar.");return;}updateProject({brand:{...project.brand,avatar:await fileToData(f)}});};
  const uploadReference = async e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")){setNotice("Pilih file gambar.");return;}setReference(await fileToData(f));};
  const setGridSlot = (idx)=>{const grid=[...project.grid];grid[idx]={slideId:current.id,slide:current,style:project.style,ratio:project.ratio};updateProject({grid});setNotice(`Slide disimpan ke slot ${idx+1}.`);};
  const clearGridSlot = idx=>{const grid=[...project.grid];grid[idx]=null;updateProject({grid});};
  const saveGridAsOrder = (from,to)=>{if(to<0||to>8)return;const grid=[...project.grid];const [item]=grid.splice(from,1);grid.splice(to,0,item);updateProject({grid});};

  const tabs=[["editor","Editor",Layers3],["ai","AI Studio",WandSparkles],["caption","Caption",Type],["grid","Grid Planner",Grid3X3],["settings","Pengaturan",Settings2]];
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>MagicFeed Maker</strong><small>PRO STUDIO · CAROUSEL CREATOR</small></div></div>
      <div className="top-actions">
        <button className="btn ghost" onClick={newProject}><Plus size={16}/> Proyek Baru</button>
        <button className="btn secondary" onClick={saveProject}><Save size={16}/> Simpan</button>
        <button className="btn primary" onClick={exportAll} disabled={busy}><Download size={16}/> Export ZIP</button>
      </div>
    </header>

    <nav className="tabbar">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?"tab active":"tab"} onClick={()=>setTab(id)}><Icon size={16}/>{label}</button>)}</nav>
    {notice&&<div className="notice" role="status"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}

    <main className="workspace">
      <section className="main-column">
        {tab==="editor"&&<>
          <div className="section-heading"><div><span className="eyebrow">WORKSPACE</span><h1>Carousel Editor</h1><p>Atur isi, gaya visual, dan identitas brand.</p></div><div className="heading-actions"><button className="btn secondary" onClick={duplicateSlide}><Copy size={15}/> Duplikat</button><button className="btn danger-outline" onClick={deleteSlide}><Trash2 size={15}/> Hapus</button></div></div>
          <div className="editor-layout">
            <aside className="slide-list-panel">
              <div className="panel-title"><b>SLIDE ({project.slides.length}/10)</b><button className="icon-btn" onClick={addSlide} title="Tambah slide"><Plus size={17}/></button></div>
              <div className="slide-list">{project.slides.map((s,i)=><div key={s.id} draggable onDragStart={()=>setDragIndex(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragIndex!==null)moveSlide(dragIndex,i);setDragIndex(null);}} className={`slide-list-item ${i===active?"selected":""}`} onClick={()=>setActive(i)}>
                <GripVertical size={14} className="grip"/><span className="slide-num">{String(i+1).padStart(2,"0")}</span><div className="slide-mini-copy"><b>{s.headline||"Slide tanpa judul"}</b><small>{s.type.toUpperCase()}</small></div>
              </div>)}</div>
              <button className="btn add-slide" onClick={addSlide}><Plus size={16}/> Tambah Slide</button>
            </aside>
            <div className="canvas-panel">
              <div className="canvas-toolbar"><span>PREVIEW · {project.ratio}</span><div><button className="icon-btn" onClick={()=>setActive(Math.max(0,active-1))} disabled={active===0}><ChevronLeft/></button><span>{active+1} / {project.slides.length}</span><button className="icon-btn" onClick={()=>setActive(Math.min(project.slides.length-1,active+1))} disabled={active===project.slides.length-1}><ChevronRight/></button></div></div>
              <div className="preview-stage"><div ref={stageRef} className="export-stage"><SlideCanvas slide={current} project={project}/></div></div>
              <div className="canvas-footer"><span>Pratinjau desain akhir</span><div><button className="btn secondary small" onClick={exportOne} disabled={busy}><Download size={14}/> PNG Slide</button><button className="btn primary small" onClick={exportAll} disabled={busy}><Download size={14}/> Semua Slide</button></div></div>
            </div>
            <aside className="properties-panel">
              <div className="panel-title"><b>EDIT KONTEN</b></div>
              <label>Jenis Slide<select value={current.type} onChange={e=>updateSlide({type:e.target.value})}><option value="hook">Hook / Pembuka</option><option value="content">Konten</option><option value="cta">Call to Action</option></select></label>
              <label>Tag / Label<input value={current.tag} onChange={e=>updateSlide({tag:e.target.value})} placeholder="Contoh: 01 — TIPS"/></label>
              <label>Headline<textarea rows="3" value={current.headline} onChange={e=>updateSlide({headline:e.target.value})}/></label>
              <label>Subtitle<textarea rows="3" value={current.subtitle} onChange={e=>updateSlide({subtitle:e.target.value})}/></label>
              <div className="label-row"><label>Poin Konten</label><button className="text-btn" onClick={addPoint}>+ Tambah poin</button></div>
              {(current.points||[]).map((p,i)=><div className="point-input" key={i}><input value={p} onChange={e=>changePoint(i,e.target.value)}/><button className="icon-btn danger" onClick={()=>removePoint(i)}><X size={14}/></button></div>)}
              <label>CTA Button Text<input value={current.ctaText} onChange={e=>updateSlide({ctaText:e.target.value})} placeholder="FOLLOW UNTUK TIPS LAINNYA"/></label>
              <div className="inline-actions"><button className="btn secondary small" onClick={()=>moveSlide(active,active-1)} disabled={active===0}>Naik</button><button className="btn secondary small" onClick={()=>moveSlide(active,active+1)} disabled={active===project.slides.length-1}>Turun</button></div>
            </aside>
          </div>
          <div className="lower-panels">
            <div className="settings-card"><h3><Layers3 size={16}/> Gaya Visual</h3><div className="style-grid">{STYLES.map(s=><button key={s.id} className={`style-option ${project.style===s.id?"chosen":""}`} onClick={()=>updateProject({style:s.id})}><span style={{background:s.bg,borderColor:s.accent}}></span><b>{s.name}</b></button>)}</div><div className="two-fields"><label>Rasio<select value={project.ratio} onChange={e=>updateProject({ratio:e.target.value})}><option value="4:5">Portrait 4:5 (1080×1350)</option><option value="1:1">Square 1:1 (1080×1080)</option></select></label><label>Ukuran Headline<input type="range" min="14" max="36" value={project.fontSize} onChange={e=>updateProject({fontSize:Number(e.target.value)})}/><small>{project.fontSize}px</small></label></div></div>
            <div className="settings-card"><h3><Eye size={16}/> Branding</h3><label>Username<input value={project.brand.username} onChange={e=>updateProject({brand:{...project.brand,username:e.target.value}})}/></label><div className="check-row"><label><input type="checkbox" checked={project.brand.verified} onChange={e=>updateProject({brand:{...project.brand,verified:e.target.checked}})}/> Verified badge</label><label><input type="checkbox" checked={project.brand.showBrand} onChange={e=>updateProject({brand:{...project.brand,showBrand:e.target.checked}})}/> Tampilkan branding</label></div><div className="avatar-row">{project.brand.avatar?<img src={project.brand.avatar}/>:<div className="avatar-placeholder">M</div>}<button className="btn secondary small" onClick={()=>avatarInput.current.click()}><Upload size={14}/> Upload Avatar</button>{project.brand.avatar&&<button className="text-btn" onClick={()=>updateProject({brand:{...project.brand,avatar:""}})}>Hapus</button>}<input hidden ref={avatarInput} type="file" accept="image/*" onChange={uploadAvatar}/></div></div>
          </div>
        </>}

        {tab==="ai"&&<div className="tab-page"><div className="section-heading"><div><span className="eyebrow">CONTENT GENERATOR</span><h1>AI Carousel Studio</h1><p>Ubah satu ide menjadi carousel terstruktur dan siap diedit.</p></div><span className="pill-free">GEMINI · FREE TIER*</span></div><div className="form-card ai-card">
          <label>Topik / Ide Carousel<textarea rows="4" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Contoh: 7 kesalahan finansial yang membuat anak muda sulit menabung…"/></label>
          <div className="two-fields"><label>Niche<select value={project.niche} onChange={e=>updateProject({niche:e.target.value})}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></label><label>Jumlah Slide<select value={slideCount} onChange={e=>setSlideCount(Number(e.target.value))}>{[3,4,5,6,8,10].map(n=><option key={n} value={n}>{n} slide</option>)}</select></label></div>
          <div className="reference-box"><div><b><ImagePlus size={17}/> Referensi Visual (opsional)</b><small>Unggah gambar untuk memberi konteks gaya atau isi kepada AI.</small></div><button className="btn secondary small" onClick={()=>refInput.current.click()}><Upload size={14}/> Pilih Gambar</button><input hidden ref={refInput} type="file" accept="image/*" onChange={uploadReference}/>{reference&&<div className="ref-preview"><img src={reference}/><button className="icon-btn danger" onClick={()=>setReference("")}><X size={14}/></button><div className="ref-controls"><label>Opacity <input type="range" min=".1" max="1" step=".05" value={refOpacity} onChange={e=>setRefOpacity(Number(e.target.value))}/></label><label>Blur <input type="range" min="0" max="10" value={refBlur} onChange={e=>setRefBlur(Number(e.target.value))}/></label></div></div>}</div>
          <div className="ai-style-note"><span className="style-swatch" style={{background:style.bg,borderColor:style.accent}}></span><span>Gaya output mengikuti <b>{style.name}</b>. Ubah gaya di tab Editor sebelum generate.</span></div>
          <button className="btn primary generate-btn" onClick={generateAI} disabled={busy}><WandSparkles size={18}/>{busy?"Sedang memproses…":"Generate Carousel dengan AI"}</button>
          <small className="disclaimer">*Penggunaan Gemini API mengikuti ketersediaan kuota free tier dan kebijakan Google. Referensi visual diteruskan ke Gemini untuk dianalisis; opacity/blur adalah panduan tampilan referensi, bukan filter gambar yang dikirim.</small>
        </div></div>}

        {tab==="caption"&&<div className="tab-page"><div className="section-heading"><div><span className="eyebrow">SOCIAL COPY</span><h1>Caption Manager</h1><p>Kelola caption Instagram yang melengkapi carousel.</p></div></div><div className="form-card"><label>Caption<textarea className="caption-area" rows="16" value={project.caption} onChange={e=>updateProject({caption:e.target.value})} placeholder="Tulis caption atau generate dari AI Studio…"/></label><div className="caption-actions"><span>{project.caption.length} karakter</span><button className="btn secondary" onClick={()=>{navigator.clipboard.writeText(project.caption);setNotice("Caption disalin.");}}><Copy size={15}/> Salin Caption</button></div></div></div>}

        {tab==="grid"&&<div className="tab-page"><div className="section-heading"><div><span className="eyebrow">FEED PLANNER</span><h1>Grid Planner</h1><p>Susun preview 3×3 tampilan feed Instagram.</p></div><button className="btn secondary" onClick={()=>updateProject({grid:Array(9).fill(null)})}><RefreshCw size={15}/> Kosongkan Grid</button></div><div className="grid-planner-layout"><div className="grid-board">{project.grid.map((slot,i)=><div key={i} className={`grid-slot ${selectedGrid===i?"grid-selected":""}`} onClick={()=>setSelectedGrid(i)}>{slot?<div className="grid-mini"><SlideCanvas slide={slot.slide} project={{...project,style:slot.style,ratio:"1:1"}} preview/><button className="grid-remove" onClick={e=>{e.stopPropagation();clearGridSlot(i);}}>×</button></div>:<div className="empty-slot"><Plus/><span>Slot {i+1}</span></div>}</div>)}</div><div className="grid-tools"><h3>Slot {selectedGrid+1}</h3><p>Pilih slide yang sedang aktif di Editor, lalu simpan ke slot yang dipilih.</p><button className="btn primary" onClick={()=>setGridSlot(selectedGrid)}><Plus size={15}/> Simpan Slide Aktif</button><div className="divider-line"></div><b>Slide yang dipilih</b><p className="selected-headline">{current.headline}</p><button className="btn secondary" onClick={()=>setTab("editor")}>Buka Editor</button><small>Tips: pilih slot pada grid untuk mengganti posisi. Slot dapat dikosongkan dengan tombol ×.</small></div></div><div className="grid-reorder"><b>Atur urutan slot</b>{project.grid.map((_,i)=><button key={i} className={selectedGrid===i?"active":""} onClick={()=>setSelectedGrid(i)}>{i+1}</button>)}</div></div>}

        {tab==="settings"&&<div className="tab-page"><div className="section-heading"><div><span className="eyebrow">CONFIGURATION</span><h1>Pengaturan</h1><p>Konfigurasi koneksi AI dan kelola proyek lokal.</p></div></div><div className="form-card"><h3><WandSparkles size={17}/> Gemini API Worker</h3><p className="muted">Masukkan URL Worker Cloudflare yang sudah dipasang. API key Gemini disimpan sebagai Secret di Cloudflare, bukan di sini.</p><label>URL Cloudflare Worker<input value={workerUrl} onChange={e=>setWorkerUrl(e.target.value)} placeholder="https://magicfeed-ai.nama-akun.workers.dev"/></label><button className="btn primary" onClick={()=>{localStorage.setItem("magicfeed_worker_url",workerUrl.trim());setNotice("URL Worker disimpan di browser ini.");}}>Simpan URL Worker</button><div className="divider-line"></div><h3><FolderOpen size={17}/> Proyek Tersimpan di Perangkat</h3><p className="muted">Data disimpan di browser/perangkat ini. Bersihkan data situs atau gunakan browser lain dapat menghapus/memisahkan data.</p><button className="btn secondary" onClick={refreshProjects}><RefreshCw size={15}/> Muat Ulang Daftar</button><div className="saved-projects">{projects.length?projects.map(p=><div className="saved-project" key={p.id}><div><b>{p.name}</b><small>{p.slides?.length||0} slide · {new Date(p.updatedAt).toLocaleString("id-ID")}</small></div><button className="btn secondary small" onClick={()=>loadProject(p)}><FolderOpen size={14}/> Buka</button><button className="icon-btn danger" onClick={()=>deleteProject(p.id)}><Trash2 size={15}/></button></div>):<p className="muted">Belum ada proyek tersimpan.</p>}</div></div></div>}
      </section>
    </main>
    <footer className="app-footer"><span>MAGICFEED MAKER PRO STUDIO</span><span>Local-first · Designed for creators</span></footer>
  </div>;
}