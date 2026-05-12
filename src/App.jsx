import { useState } from "react";

const SUPABASE_URL = "https://occqjipaelbalqrfpffq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jY3FqaXBhZWxiYWxxcmZwZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTA3MTIsImV4cCI6MjA5MzU4NjcxMn0.VH6ule4CwUhA36vb0EXoInhM9sv14q574tW-5R8stv8";

const SYSTEMS = [
  "Cardiovascular","Respiratory","Renal","Nervous System","Endocrine",
  "Musculoskeletal","Gastrointestinal","Immune","Acid-Base Balance"
];

const LEVELS = [
  { id:"remember", label:"Remembering", color:"#1D9E75", desc:"Define concepts, explain calculations, describe physiological roles" },
  { id:"understand", label:"Understanding", color:"#378ADD", desc:"Explain why and how mechanisms work" },
  { id:"apply", label:"Applying", color:"#7F77DD", desc:"Identify mechanisms behind patient presentations" },
  { id:"analyze", label:"Analyzing", color:"#EF9F27", desc:"Trace cascades, map feedback loops, dissect dysfunction" },
  { id:"evaluate", label:"Evaluating", color:"#D85A30", desc:"Weigh competing mechanisms and justify clinical reasoning" },
  { id:"create", label:"Creating", color:"#D4537E", desc:"Synthesize multiple systems into coherent clinical narratives" },
];

const LEVEL_CONTEXT = {
  remember: "definitions, calculations, physiological roles, and conceptual relationships. Never ask for specific normal values or quantities.",
  understand: "explaining WHY or HOW a single mechanism or process works.",
  apply: "identifying which physiological mechanism best explains a patient's signs and symptoms.",
  analyze: "tracing how one physiological dysfunction cascades into others, identifying disrupted feedback loops.",
  evaluate: "weighing competing physiological mechanisms, justifying why one compensatory response is more significant.",
  create: "synthesizing multiple mechanisms or systems into a coherent explanation requiring original integrative thinking.",
};

const LEVEL_PROMPTS = {
  remember: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Generate exactly 5 recall questions for "${sys}" physiology at the Remembering level of Bloom's Taxonomy. Questions should test single concepts in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Wrong answer choices should be physiologically plausible. Do NOT ask for specific normal values or quantities. Return ONLY valid JSON (no markdown, no backticks):
{"type":"flashcard","concept":"key concept being tested","cards":[{"q":"question text","a":"answer text"}]}`,

  understand: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Generate 3 explain-it-back questions for "${sys}" physiology at the Understanding level of Bloom's Taxonomy. Questions should ask students to explain WHY or HOW a single mechanism works in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Keep ion channel questions limited to locations and how they work. Do not ask students to explain the molecular distribution of voltage-gated, chemically-gated, or mechanically-gated channels. Keep each question narrow, focused on one concept, and answerable by a student who has read the relevant textbook chapter. Key points must be strictly limited to what the question explicitly asks. Return ONLY valid JSON:
{"prompts":[{"prompt":"question","keyPoints":["point directly answering the question","point directly answering the question","point directly answering the question"]}]}`,

  apply: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Create 3 clinical patient scenarios for "${sys}" physiology at the Applying level of Bloom's Taxonomy. Each scenario presents observable signs/symptoms and asks the student to identify one specific mechanism in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Multiple choice options should represent different mechanisms. Each scenario must not expect students to diagnose medical conditions — only identify what system is out of homeostasis and why. The explanation must be 1-2 sentences maximum. Return ONLY valid JSON:
{"scenarios":[{"setup":"patient description","question":"which mechanism best explains this?","options":["A. mechanism","B. mechanism","C. mechanism","D. mechanism"],"correct":"A","explanation":"1-2 sentence explanation"}]}`,

  analyze: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Create 2 analysis challenges for "${sys}" physiology at the Analyzing level of Bloom's Taxonomy. Present a patient situation with observable findings and ask the student to identify which system is disrupted and why in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Students should not be asked to make a medical diagnosis. Return ONLY valid JSON:
{"cases":[{"title":"case title","presentation":"patient situation","task":"one focused analytical question","keyMechanisms":["mechanism 1","mechanism 2","mechanism 3"],"clinicalConnections":"how this connects to the patient situation"}]}`,

  evaluate: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Create 2 evaluation challenges for "${sys}" physiology at the Evaluating level of Bloom's Taxonomy. Each challenge asks the student to weigh competing physiological mechanisms in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Return ONLY valid JSON:
{"challenges":[{"scenario":"clinical situation","question":"one focused evaluative question","considerations":["consideration 1","consideration 2","consideration 3"],"clinicalRationale":"expert reasoning"}]}`,

  create: (sys) => `You are a human anatomy and physiology professor who teaches both at the same time to second or third semester students using a two-semester anatomy and physiology textbook such as Marieb or Martini. Create a synthesis task for "${sys}" physiology at the Creating level of Bloom's Taxonomy. The task should require the student to integrate multiple mechanisms into a coherent physiological explanation in plain accessible language appropriate for freshman or sophomore health sciences students. Do not ask about biochemical detail, membrane transport mechanisms, or any other concept beyond what Marieb or Martini would cover at this level. Return ONLY valid JSON:
{"task":{"title":"task title","prompt":"specific synthesis task","scaffold":["step 1","step 2","step 3","step 4"],"exampleElements":["element 1","element 2","element 3"],"rubricHints":["marker 1","marker 2","marker 3"]}}`,
};

function buildPrompt(system, level, history) {
  const historyStr = history.length === 0 ? "No questions asked yet." :
    history.map((h,i) => `Q${i+1} [${h.correct?"CORRECT":"INCORRECT"}]: ${h.question} | Concept: ${h.concept}`).join("\n");
  const struggling = history.filter(h=>!h.correct).map(h=>h.concept);
  const mastered = history.filter(h=>h.correct).map(h=>h.concept);
  const seed = Math.floor(Math.random()*1000);
  return `You are an adaptive physiology tutor. A student is studying "${system}" physiology at the "${level.label}" level of Bloom's Taxonomy.

LEARNER PROFILE: 2nd or 3rd semester health sciences students using Marieb or Martini. Questions must be appropriate for freshman or sophomore level. Do not ask about biochemical detail, membrane transport mechanisms, or any concept beyond what Marieb or Martini would cover.

LEVEL FOCUS: ${LEVEL_CONTEXT[level.id]}

STUDENT HISTORY:
${historyStr}
Struggling: ${struggling.length?struggling.join(", "):"none"}
Mastered: ${mastered.length?mastered.join(", "):"none"}

RANDOMIZATION SEED: ${seed} — vary your starting concept.

ADAPTIVE INSTRUCTIONS:
- Wrong answer → approach same concept differently
- Repeated struggle → more foundational question
- Performing well → increase complexity
- Never repeat a question
- Keep key points scoped to what the question asks

Generate ONE question. Return ONLY valid JSON:
For explain: {"type":"explain","concept":"name","question":"question","keyPoints":["point 1","point 2","point 3"],"reachingQuestion":"simpler follow-up","advancingQuestion":"harder follow-up"}
For mcq: {"type":"mcq","concept":"name","setup":"scenario","question":"question","options":["A. ...","B. ...","C. ...","D. ..."],"correct":"A","explanation":"1-2 sentences confirming correct answer","reachingQuestion":"simpler","advancingQuestion":"harder"}
For case: {"type":"case","concept":"name","presentation":"scenario","task":"task","keyMechanisms":["m1","m2","m3"],"clinicalRationale":"reasoning","reachingQuestion":"simpler","advancingQuestion":"harder"}`;
}

async function apiCall(prompt, maxTokens=200) {
  const res = await fetch("/api/chat",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  const raw = data.content?.map(b=>b.text||"").join("")||"";
  return JSON.parse(raw.replace(/```json|```/g,"").trim());
}

async function logToSupabase(data) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: data.student_id || "unknown",
        session_id: data.session_id || "unknown",
        system: data.system || null,
        level: data.level || null,
        concept: data.concept || null,
        question: data.question || null,
        correct: data.correct ?? false,
        status: data.status || null,
        hint_requested: data.hint_requested ?? false,
        attempts: data.attempts || 0
      })
    });
  } catch(e) { console.error("Log error:", e); }
}
      body:JSON.stringify({
        student_id:data.student_id||"unknown",
        session_id:data.session_id||"unknown",
        system:data.system||null,
        level:data.level||null,
        concept:data.concept||null,
        question:data.question||null,
        correct:data.correct??false,
        status:data.status||null,
        hint_requested:data.hint_requested??false,
        attempts:data.attempts||0
      })
    });
  } catch(e){ console.error("Supabase error:",e); }
}

function getStudentId() {
  try {
    let id = sessionStorage.getItem("stu_id");
    if(!id){id="stu_"+Math.random().toString(36).slice(2,9);sessionStorage.setItem("stu_id",id);}
    return id;
  } catch(e){ return "stu_unknown"; }
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem("session_id");
    if(!id){id=Math.random().toString(36).slice(2);sessionStorage.setItem("session_id",id);}
    return id;
  } catch(e){ return "sess_unknown"; }
}

function Spinner({msg}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,color:"var(--color-text-secondary)",fontSize:14,padding:"1rem 0"}}>
      <div style={{width:16,height:16,border:"2px solid var(--color-border-secondary)",borderTopColor:"var(--color-text-primary)",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
      {msg||"Loading..."}
    </div>
  );
}

function RetryError({onRetry,msg}) {
  return (
    <div style={{padding:"12px 16px",borderRadius:8,background:"var(--color-background-danger)",fontSize:14,lineHeight:1.6,marginBottom:12}}>
      <p style={{marginBottom:8}}>{msg||"Something went wrong — your answer was not evaluated. Nothing has been revealed."}</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}

function ProgressDots({history}) {
  const colors={correct:"#1D9E75",partial:"#D85A30",reviewed:"#378ADD"};
  return (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
      {history.slice(0,20).map((h,i)=>(
        <div key={i} style={{width:10,height:10,borderRadius:"50%",background:colors[h.status]||"var(--color-border-secondary)"}}/>
      ))}
      {history.length>20&&<span style={{fontSize:12,color:"var(--color-text-secondary)"}}>+{history.length-20} more</span>}
    </div>
  );
}

function ProgressIndicator({covered,total}) {
  return (
    <div style={{marginBottom:14}}>
      <p style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>
        Building your answer: {covered} of {total} key concepts covered
      </p>
      <div style={{display:"flex",gap:4}}>
        {Array.from({length:total}).map((_,i)=>(
          <div key={i} style={{height:8,flex:1,borderRadius:4,background:i<covered?"#1D9E75":"var(--color-border-secondary)",transition:"background 0.3s"}}/>
        ))}
      </div>
    </div>
  );
}

function FlashCards({data,onResult}) {
  const [idx,setIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [answered,setAnswered]=useState(false);
  const cards=data.cards||[];
  function respond(correct) {
    setAnswered(true);
    onResult(correct,correct?"self: got it":"self: not yet",correct?"correct":"partial");
    if(idx<cards.length-1){setTimeout(()=>{setIdx(idx+1);setFlipped(false);setAnswered(false);},300);}
  }
  return (
    <div style={{textAlign:"center"}}>
      <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:12}}>Card {idx+1} of {cards.length}</p>
      <div onClick={()=>setFlipped(!flipped)} style={{cursor:"pointer",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:12,padding:"2rem",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:16}}>
        <p style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:8}}>{flipped?"ANSWER — tap to flip back":"QUESTION — tap to flip"}</p>
        <p style={{fontSize:16,fontWeight:flipped?400:500,lineHeight:1.6}}>{flipped?cards[idx]?.a:cards[idx]?.q}</p>
      </div>
      {!flipped&&(
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <button onClick={()=>{setIdx(Math.max(0,idx-1));setFlipped(false);setAnswered(false);}} disabled={idx===0}>← Prev</button>
          <button onClick={()=>setFlipped(true)}>Flip to see answer</button>
          <button onClick={()=>{setIdx(Math.min(cards.length-1,idx+1));setFlipped(false);setAnswered(false);}} disabled={idx===cards.length-1}>Next →</button>
        </div>
      )}
      {flipped&&!answered&&(
        <div>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:10}}>How did you do?</p>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <button onClick={()=>respond(false)} style={{fontSize:13,padding:"8px 16px"}}>✗ Not yet</button>
            <button onClick={()=>respond(true)} style={{fontSize:13,padding:"8px 16px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:8}}>✓ Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MCQQuestion({q,onResult}) {
  const [selected,setSelected]=useState(null);
  const [checked,setChecked]=useState(false);
  const correct=q.correct;
  function getStyle(letter) {
    const isSel=selected===letter,isCorrect=correct===letter;
    let bg="var(--color-background-secondary)",border="1.5px solid var(--color-border-secondary)";
    if(checked&&isCorrect){bg="var(--color-background-success)";border="1.5px solid #1D9E75";}
    else if(checked&&isSel&&!isCorrect){bg="var(--color-background-danger)";border="1.5px solid #D85A30";}
    else if(!checked&&isSel){bg="var(--color-background-info)";border="1.5px solid #378ADD";}
    return {padding:"10px 14px",borderRadius:8,border,background:bg,cursor:checked?"default":"pointer",fontSize:14,lineHeight:1.5,userSelect:"none",marginBottom:8};
  }
  return (
    <div>
      {q.setup&&<div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:14,marginBottom:14,fontSize:14,lineHeight:1.7}}>{q.setup}</div>}
      <p style={{fontWeight:500,fontSize:15,lineHeight:1.6,marginBottom:14}}>{q.question}</p>
      <div style={{marginBottom:16}}>
        {(q.options||[]).map((opt,i)=>{
          const letter=opt[0];
          return <div key={i} onClick={()=>!checked&&setSelected(letter)} style={getStyle(letter)}>{opt}</div>;
        })}
      </div>
      {!checked?(
        <button onClick={()=>setChecked(true)} disabled={!selected}>Check answer</button>
      ):(
        <>
          <div style={{padding:"10px 14px",borderRadius:8,marginBottom:12,fontSize:14,lineHeight:1.6,background:selected===correct?"var(--color-background-success)":"var(--color-background-danger)"}}>
            {selected===correct?"✓ Correct — well done!":"✗ Not quite — review the explanation below."}
          </div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:12,fontSize:14,lineHeight:1.6,marginBottom:12}}>
            <strong>Explanation: </strong>{q.explanation}
          </div>
          <button onClick={()=>onResult(selected===correct,selected,selected===correct?"correct":"partial")}>Next question →</button>
        </>
      )}
    </div>
  );
}

function ExplainQuestion({q,onResult}) {
  const [answer,setAnswer]=useState("");
  const [stage,setStage]=useState("writing");
  const [status,setStatus]=useState(null);
  const [followUpQ,setFollowUpQ]=useState(null);
  const [hint,setHint]=useState("");
  const [followUpAnswer,setFollowUpAnswer]=useState("");
  const [followUpFeedback,setFollowUpFeedback]=useState(null);
  const [followUpCorrect,setFollowUpCorrect]=useState(false);
  const [hintShown,setHintShown]=useState(false);
  const [error,setError]=useState(null);
  const [attemptCount,setAttemptCount]=useState(0);
  const [coveredConcepts,setCoveredConcepts]=useState([]);
  const [totalConcepts,setTotalConcepts]=useState(0);
  const [answerHistory,setAnswerHistory]=useState([]);

  async function scoreAnswer() {
    setStage("scoring");setError(null);
    try {
      const result=await apiCall(
        `Respond with ONLY one of these two JSON objects — no other text:
{"status":"complete"}
{"status":"partial"}
"complete" if student adequately answered what was asked. "partial" if anything important is missing.
Question: "${q.question}"
Required concepts: ${(q.keyPoints||[]).join("; ")}
Student answer: "${answer}"`,20
      );
      setStatus(result.status);
      if(result.status==="complete"){setCoveredConcepts(q.keyPoints||[]);setTotalConcepts((q.keyPoints||[]).length);setStage("complete");}
      else{setTotalConcepts((q.keyPoints||[]).length);setAnswerHistory([answer]);await generateFollowUp([answer]);}
    } catch(e){setError("score");setStage("writing");}
  }

  async function generateFollowUp(history) {
    setStage("generating");setError(null);setFollowUpAnswer("");setFollowUpFeedback(null);setFollowUpCorrect(false);setHintShown(false);
    try {
      const result=await apiCall(
        `You are a human anatomy and physiology professor. A student is answering step by step.
Original question: "${q.question}"
Key concepts needed: ${(q.keyPoints||[]).join("; ")}
Answer history:
${history.map((a,i)=>`Attempt ${i+1}: "${a}"`).join("\n")}
Generate ONE Socratic follow-up targeting the most important missing concept.
Return ONLY this JSON:
{"followUpQuestion":"question","followUpAnswer":"correct answer","hint":"gentle nudge","conceptsCovered":2,"totalConcepts":4}`,300
      );
      setFollowUpQ({question:result.followUpQuestion,answer:result.followUpAnswer});
      setHint(result.hint);
      setCoveredConcepts(Array.from({length:result.conceptsCovered||0}));
      setTotalConcepts(result.totalConcepts||(q.keyPoints||[]).length);
      setStage("followup");
    } catch(e){setError("followup");setStage("followup_error");}
  }

  async function scoreFollowUp() {
    setStage("followup_scoring");setError(null);
    try {
      const result=await apiCall(
        `Is this student answer correct or close enough? Return ONLY this JSON:
{"correct":true,"feedback":"one sentence — affirm warmly if correct, gently correct if not"}
Question: "${followUpQ.question}"
Expected: "${followUpQ.answer}"
Student answer: "${followUpAnswer}"`,100
      );
      setFollowUpFeedback(result.feedback);
      setFollowUpCorrect(result.correct);
      const newHistory=[...answerHistory,followUpAnswer];
      setAnswerHistory(newHistory);
      const newCount=attemptCount+1;
      setAttemptCount(newCount);
      if(result.correct){
        if(coveredConcepts.length>=totalConcepts-1||newCount>=6)setStage("complete");
        else await generateFollowUp(newHistory);
      } else {
        if(newCount>=6)setStage("complete");
        else setStage("followup");
      }
    } catch(e){setError("followup_score");setStage("followup");}
  }

  async function evaluateHintRequest() {
    setStage("hint_checking");
    try {
      const result=await apiCall(
        `You are a human anatomy and physiology professor. Evaluate this student hint request.
Question: "${followUpQ?.question}"
Student attempt: "${followUpAnswer}"
Return ONLY one of: {"evaluation":"not_genuine"} or {"evaluation":"wrong"} or {"evaluation":"partial"} or {"evaluation":"correct"}`,20
      );
      if(result.evaluation==="not_genuine"){setStage("hint_blocked");setTimeout(()=>setStage("hint_ready"),60000);}
      else if(result.evaluation==="wrong"){setStage("followup");}
      else if(result.evaluation==="partial"){setHintShown(true);setStage("followup");}
      else if(result.evaluation==="correct"){setStage("complete");}
    } catch(e){setHintShown(true);setStage("followup");}
  }

  const statusColor=status==="complete"?"#1D9E75":"#EF9F27";
  const statusLabel=status==="complete"?"✓ Complete":"◐ Good start";
  const statusMsg=status==="complete"?"You covered the key concepts — well done!":"Good start — let's build on that!";

  return (
    <div>
      <p style={{fontWeight:500,fontSize:16,lineHeight:1.6,marginBottom:16}}>{q.question}</p>
      <textarea value={answer} onChange={e=>setAnswer(e.target.value)} disabled={stage!=="writing"}
        placeholder="Type your answer here before submitting..."
        style={{width:"100%",minHeight:100,padding:"10px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontSize:14,lineHeight:1.6,fontFamily:"inherit",resize:"vertical",marginBottom:12,color:"var(--color-text-primary)"}}/>
      {stage==="writing"&&(
        <>
          {error==="score"&&<RetryError onRetry={scoreAnswer}/>}
          <button onClick={scoreAnswer} disabled={answer.trim().length<10}
            style={{padding:"10px 20px",fontSize:14,fontWeight:500,borderRadius:8,background:answer.trim().length>=10?"#1D9E75":"var(--color-background-secondary)",color:answer.trim().length>=10?"#fff":"var(--color-text-secondary)",border:"none",cursor:answer.trim().length>=10?"pointer":"default"}}>
            {answer.trim().length<10?`Keep writing... (${answer.trim().length}/10 min)`:"Submit answer →"}
          </button>
        </>
      )}
      {stage==="scoring"&&<Spinner msg="Evaluating your answer..."/>}
      {stage==="generating"&&<Spinner msg="Preparing next question..."/>}
      {stage==="followup_scoring"&&<Spinner msg="Checking your answer..."/>}
      {stage==="hint_checking"&&<Spinner msg="Checking your attempt..."/>}
      {status&&stage!=="scoring"&&stage!=="generating"&&(
        <div style={{borderRadius:10,padding:14,marginBottom:14,border:`1.5px solid ${statusColor}`,background:`${statusColor}18`}}>
          <span style={{fontWeight:500,fontSize:14,color:statusColor,display:"block",marginBottom:4}}>{statusLabel}</span>
          <span style={{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.6}}>{statusMsg}</span>
        </div>
      )}
      {totalConcepts>0&&stage!=="complete"&&stage!=="writing"&&stage!=="scoring"&&(
        <ProgressIndicator covered={coveredConcepts.length} total={totalConcepts}/>
      )}
      {(stage==="followup"||stage==="followup_scoring"||stage==="hint_checking"||stage==="hint_blocked"||stage==="hint_ready")&&followUpQ&&(
        <div style={{border:"0.5px solid var(--color-border-secondary)",borderRadius:10,padding:14,marginBottom:14}}>
          <p style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            Follow-up question {attemptCount+1} of 6
          </p>
          <p style={{fontSize:15,fontWeight:500,lineHeight:1.6,marginBottom:12}}>{followUpQ.question}</p>
          {followUpFeedback&&(
            <div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,lineHeight:1.6,background:followUpCorrect?"var(--color-background-success)":"var(--color-background-danger)"}}>
              {followUpCorrect?"✓ ":"✗ "}{followUpFeedback}
            </div>
          )}
          {stage==="hint_blocked"&&(
            <div style={{padding:"10px 12px",borderRadius:8,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",fontSize:13,lineHeight:1.6,marginBottom:10}}>
              You haven't given this one a try yet. Take a minute, think it through, and write down whatever comes to mind — we can work from there.
            </div>
          )}
          {error==="followup_score"&&<RetryError onRetry={scoreFollowUp}/>}
          {!followUpCorrect&&stage!=="hint_blocked"&&(
            <>
              <textarea value={followUpAnswer} onChange={e=>setFollowUpAnswer(e.target.value)}
                disabled={stage==="followup_scoring"||stage==="hint_checking"||followUpFeedback!==null}
                placeholder="Your answer..."
                style={{width:"100%",minHeight:70,padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontSize:14,lineHeight:1.5,fontFamily:"inherit",resize:"vertical",marginBottom:10,color:"var(--color-text-primary)"}}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:hintShown?12:0}}>
                <button onClick={scoreFollowUp} disabled={followUpAnswer.trim().length<3||stage==="followup_scoring"||stage==="hint_checking"||followUpFeedback!==null} style={{fontSize:13,padding:"7px 14px"}}>Submit →</button>
                {!hintShown&&<button onClick={evaluateHintRequest} disabled={stage==="followup_scoring"||stage==="hint_checking"} style={{fontSize:13,padding:"7px 14px"}}>I need a hint</button>}
                <button onClick={()=>setStage("complete")} style={{fontSize:13,padding:"7px 14px"}}>Move on →</button>
              </div>
              {hintShown&&(
                <div style={{padding:"10px 12px",borderRadius:8,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",fontSize:13,fontStyle:"italic",color:"var(--color-text-secondary)",lineHeight:1.6,marginTop:4}}>
                  💡 {hint}
                </div>
              )}
            </>
          )}
          {followUpCorrect&&stage!=="complete"&&stage!=="generating"&&(
            <p style={{fontSize:13,color:"#1D9E75",fontStyle:"italic"}}>Moving to the next concept...</p>
          )}
        </div>
      )}
      {stage==="followup_error"&&<RetryError onRetry={()=>generateFollowUp(answerHistory)}/>}
      {stage==="complete"&&(
        <>
          <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:14,marginBottom:14}}>
            <p style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>
              {status==="complete"?"🎉 Here's the complete picture:":"Here's what a complete answer looks like:"}
            </p>
            <ul style={{margin:0,paddingLeft:20}}>
              {(q.keyPoints||[]).map((p,i)=><li key={i} style={{fontSize:14,marginBottom:6,lineHeight:1.6}}>{p}</li>)}
            </ul>
          </div>
          <button onClick={()=>onResult(status==="complete"||attemptCount>0,answer,status||"partial")}>Next question →</button>
        </>
      )}
    </div>
  );
}

function CaseQuestion({q,onResult}) {
  const [answer,setAnswer]=useState("");
  const [stage,setStage]=useState("writing");
  const [status,setStatus]=useState(null);
  const [followUpQ,setFollowUpQ]=useState(null);
  const [hint,setHint]=useState("");
  const [followUpAnswer,setFollowUpAnswer]=useState("");
  const [followUpFeedback,setFollowUpFeedback]=useState(null);
  const [followUpCorrect,setFollowUpCorrect]=useState(false);
  const [hintShown,setHintShown]=useState(false);
  const [error,setError]=useState(null);
  const [attemptCount,setAttemptCount]=useState(0);

  async function scoreAnswer() {
    setStage("scoring");setError(null);
    try {
      const result=await apiCall(
        `Respond with ONLY one of these two JSON objects — no other text:
{"status":"complete"}
{"status":"partial"}
Task: "${q.task}"
Required mechanisms: ${(q.keyMechanisms||[]).join("; ")}
Student answer: "${answer}"`,20
      );
      setStatus(result.status);
      if(result.status==="complete")setStage("complete");
      else await generateFollowUp();
    } catch(e){setError("score");setStage("writing");}
  }

  async function generateFollowUp() {
    setStage("generating");setError(null);setFollowUpAnswer("");setFollowUpFeedback(null);setFollowUpCorrect(false);setHintShown(false);
    try {
      const result=await apiCall(
        `You are a human anatomy and physiology professor. Generate ONE Socratic follow-up targeting the most important missing mechanism.
Task: "${q.task}"
Required mechanisms: ${(q.keyMechanisms||[]).join("; ")}
Student answer: "${answer}"
Return ONLY this JSON:
{"followUpQuestion":"question","followUpAnswer":"correct answer","hint":"gentle nudge"}`,250
      );
      setFollowUpQ({question:result.followUpQuestion,answer:result.followUpAnswer});
      setHint(result.hint);
      setStage("followup");
    } catch(e){setError("followup");setStage("followup_error");}
  }

  async function scoreFollowUp() {
    setStage("followup_scoring");setError(null);
    try {
      const result=await apiCall(
        `Is this answer correct or close enough? Return ONLY this JSON:
{"correct":true,"feedback":"one sentence"}
Question: "${followUpQ.question}"
Expected: "${followUpQ.answer}"
Student answer: "${followUpAnswer}"`,100
      );
      setFollowUpFeedback(result.feedback);
      setFollowUpCorrect(result.correct);
      const newCount=attemptCount+1;
      setAttemptCount(newCount);
      if(result.correct)setStage("complete");
      else if(newCount>=6)setStage("complete");
      else setStage("followup");
    } catch(e){setError("followup_score");setStage("followup");}
  }

  const statusColor=status==="complete"?"#1D9E75":"#EF9F27";
  const statusLabel=status==="complete"?"✓ Complete":"◐ Good start";
  const statusMsg=status==="complete"?"You covered the key mechanisms — well done!":"Good start — let's build on that!";

  return (
    <div>
      <div style={{background:"var(--color-background-secondary)",borderRadius:10,padding:14,marginBottom:14,fontSize:14,lineHeight:1.7}}>{q.presentation}</div>
      <p style={{fontWeight:500,fontSize:15,lineHeight:1.6,marginBottom:14}}>{q.task}</p>
      <textarea value={answer} onChange={e=>setAnswer(e.target.value)} disabled={stage!=="writing"}
        placeholder="Work through your reasoning here before submitting..."
        style={{width:"100%",minHeight:120,padding:"10px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontSize:14,lineHeight:1.6,fontFamily:"inherit",resize:"vertical",marginBottom:12,color:"var(--color-text-primary)"}}/>
      {stage==="writing"&&(
        <>
          {error==="score"&&<RetryError onRetry={scoreAnswer}/>}
          <button onClick={scoreAnswer} disabled={answer.trim().length<10}
            style={{padding:"10px 20px",fontSize:14,fontWeight:500,borderRadius:8,background:answer.trim().length>=10?"#1D9E75":"var(--color-background-secondary)",color:answer.trim().length>=10?"#fff":"var(--color-text-secondary)",border:"none",cursor:answer.trim().length>=10?"pointer":"default"}}>
            {answer.trim().length<10?`Keep writing... (${answer.trim().length}/10 min)`:"Submit analysis →"}
          </button>
        </>
      )}
      {stage==="scoring"&&<Spinner msg="Evaluating your analysis..."/>}
      {stage==="generating"&&<Spinner msg="Preparing a follow-up question..."/>}
      {stage==="followup_scoring"&&<Spinner msg="Checking your answer..."/>}
      {status&&stage!=="scoring"&&stage!=="generating"&&(
        <div style={{borderRadius:10,padding:14,marginBottom:14,border:`1.5px solid ${statusColor}`,background:`${statusColor}18`}}>
          <span style={{fontWeight:500,fontSize:14,color:statusColor,display:"block",marginBottom:4}}>{statusLabel}</span>
          <span style={{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.6}}>{statusMsg}</span>
        </div>
      )}
      {(stage==="followup"||stage==="followup_scoring")&&followUpQ&&(
        <div style={{border:"0.5px solid var(--color-border-secondary)",borderRadius:10,padding:14,marginBottom:14}}>
          <p style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Follow-up question {attemptCount+1} of 6</p>
          <p style={{fontSize:15,fontWeight:500,lineHeight:1.6,marginBottom:12}}>{followUpQ.question}</p>
          {followUpFeedback&&(
            <div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,lineHeight:1.6,background:followUpCorrect?"var(--color-background-success)":"var(--color-background-danger)"}}>
              {followUpCorrect?"✓ ":"✗ "}{followUpFeedback}
            </div>
          )}
          {error==="followup_score"&&<RetryError onRetry={scoreFollowUp}/>}
          {!followUpCorrect&&(
            <>
              <textarea value={followUpAnswer} onChange={e=>setFollowUpAnswer(e.target.value)}
                disabled={stage==="followup_scoring"||followUpFeedback!==null}
                placeholder="Your answer..."
                style={{width:"100%",minHeight:70,padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontSize:14,lineHeight:1.5,fontFamily:"inherit",resize:"vertical",marginBottom:10,color:"var(--color-text-primary)"}}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:hintShown?12:0}}>
                <button onClick={scoreFollowUp} disabled={followUpAnswer.trim().length<3||stage==="followup_scoring"||followUpFeedback!==null} style={{fontSize:13,padding:"7px 14px"}}>Submit →</button>
                {!hintShown&&<button onClick={()=>setHintShown(true)} style={{fontSize:13,padding:"7px 14px"}}>I need a hint</button>}
                <button onClick={()=>setStage("complete")} style={{fontSize:13,padding:"7px 14px"}}>Move on →</button>
              </div>
              {hintShown&&(
                <div style={{padding:"10px 12px",borderRadius:8,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",fontSize:13,fontStyle:"italic",color:"var(--color-text-secondary)",lineHeight:1.6,marginTop:4}}>
                  💡 {hint}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {stage==="followup_error"&&<RetryError onRetry={generateFollowUp}/>}
      {stage==="complete"&&(
        <>
          <div style={{borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid var(--color-border-secondary)"}}>
            <p style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>
              {status==="complete"?"🎉 Excellent — here's the complete picture:":"Here's what a complete answer looks like:"}
            </p>
            <ul style={{margin:"0 0 12px",paddingLeft:20}}>
              {(q.keyMechanisms||[]).map((m,i)=><li key={i} style={{fontSize:14,marginBottom:6,lineHeight:1.6}}>{m}</li>)}
            </ul>
            <p style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:6}}>Clinical rationale:</p>
            <p style={{fontSize:14,lineHeight:1.6,margin:0}}>{q.clinicalRationale}</p>
          </div>
          <button onClick={()=>onResult(status==="complete",answer,status||"partial")}>Next question →</button>
        </>
      )}
    </div>
  );
}

const TUTORIALS = {
  "Renal":{
    title:"The Renin-Angiotensin-Aldosterone System (RAAS)",
    html:`<style>
  .rt *{box-sizing:border-box;margin:0;padding:0}
  .rt{font-family:'DM Sans',sans-serif;color:#2C2C2A}
  .rt .rnav{display:flex;gap:4px;padding:12px 0 0;flex-wrap:wrap}
  .rt .rnav-btn{font-size:12px;font-weight:500;padding:5px 12px;border-radius:20px;border:1.5px solid #D3D1C7;background:white;color:#5F5E5A;cursor:pointer}
  .rt .rnav-btn.active{background:#0F6E56;border-color:#0F6E56;color:white}
  .rt .rsec{display:none;padding:16px 0 24px}
  .rt .rsec.active{display:block}
  .rt .rprog{height:3px;background:#D3D1C7;margin:8px 0 0;border-radius:2px;overflow:hidden}
  .rt .rprog-fill{height:100%;background:#0F6E56;border-radius:2px;transition:width 0.4s}
  .rt .stag{font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#0F6E56;margin-bottom:4px}
  .rt h1{font-family:Georgia,serif;font-size:20px;font-weight:600;color:#2C2C2A;line-height:1.25;margin-bottom:4px}
  .rt .rdiv{height:2px;background:linear-gradient(90deg,#0F6E56,transparent);margin:10px 0 14px;border:none}
  .rt p{font-size:13px;line-height:1.75;color:#5F5E5A;margin-bottom:10px}
  .rt .callout{background:#E1F5EE;border-left:3px solid #0F6E56;border-radius:0 8px 8px 0;padding:12px 14px;margin:12px 0;font-size:13px;line-height:1.7;color:#0F6E56;font-style:italic}
  .rt .pgrid{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .rt .pcard{border:1px solid #D3D1C7;border-radius:10px;overflow:hidden;cursor:pointer}
  .rt .pheader{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:white}
  .rt .pname{font-size:13px;font-weight:500;color:#2C2C2A}
  .rt .ptag{font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:10px}
  .rt .tag-organ{background:#EEEDFE;color:#3C3489}
  .rt .tag-sensor{background:#E1F5EE;color:#0F6E56}
  .rt .pbody{display:none;padding:10px 14px;border-top:1px solid #D3D1C7;background:#F1EFE8;font-size:12px;line-height:1.7;color:#5F5E5A}
  .rt .pbody.open{display:block}
  .rt .chev{font-size:11px;color:#5F5E5A;transition:transform .2s}
  .rt .pcard.open .chev{transform:rotate(180deg)}
  .rt .mtable{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
  .rt .mtable th{background:#3C3489;color:white;padding:6px 10px;text-align:left;font-weight:500;font-size:11px}
  .rt .mtable th:first-child{border-radius:6px 0 0 0}
  .rt .mtable th:last-child{border-radius:0 6px 0 0}
  .rt .mtable td{padding:6px 10px;border-bottom:1px solid #D3D1C7;color:#5F5E5A}
  .rt .mtable tr:nth-child(even) td{background:#EEEDFE}
  .rt .steps{display:flex;flex-direction:column;gap:0}
  .rt .step{display:flex;gap:0;position:relative}
  .rt .sleft{display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0}
  .rt .snum{width:24px;height:24px;border-radius:50%;background:#993C1D;color:white;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
  .rt .sline{width:2px;flex:1;background:#D3D1C7;margin:3px 0}
  .rt .step:last-child .sline{display:none}
  .rt .scontent{padding:0 0 16px 10px;flex:1}
  .rt .stitle{font-size:13px;font-weight:500;color:#2C2C2A;margin-bottom:4px;padding-top:2px}
  .rt .sbody{font-size:12px;line-height:1.75;color:#5F5E5A}
  .rt .takelist{display:flex;flex-direction:column;gap:0}
  .rt .take{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #D3D1C7;align-items:flex-start}
  .rt .take:last-child{border-bottom:none}
  .rt .ticon{width:28px;height:28px;border-radius:7px;background:#E1F5EE;color:#0F6E56;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .rt .tlabel{font-size:12px;font-weight:500;color:#0F6E56;margin-bottom:3px}
  .rt .ttext{font-size:12px;line-height:1.7;color:#5F5E5A}
  .rt .closing{background:#E1F5EE;border:1px solid #1D9E75;border-radius:10px;padding:14px 16px;text-align:center;font-size:13px;font-style:italic;color:#0F6E56;margin-top:16px;line-height:1.7}
  .rt .subhead{font-family:Georgia,serif;font-size:14px;font-weight:600;color:#3C3489;margin:16px 0 6px}
  .rt .diag-wrap{width:100%;overflow-x:auto}
</style>
<div class="rt">
  <div class="rnav">
    <button class="rnav-btn active" onclick="rshow(0)">1. Why RAAS?</button>
    <button class="rnav-btn" onclick="rshow(1)">2. The Players</button>
    <button class="rnav-btn" onclick="rshow(2)">3. The Cascade</button>
    <button class="rnav-btn" onclick="rshow(3)">4. The Diagram</button>
    <button class="rnav-btn" onclick="rshow(4)">5. Key Takeaways</button>
  </div>
  <div class="rprog"><div class="rprog-fill" id="rprogfill" style="width:20%"></div></div>
  <div class="rsec active" id="rs0">
    <div class="stag">Section 1</div><h1>Why Does This System Even Exist?</h1><hr class="rdiv">
    <p>RAAS is your body's answer to one urgent question: <i>"Is there enough blood volume and pressure to keep everything running?"</i> When the answer is no, RAAS launches a cascade of signals — hormones talking to organs, organs talking back — all working together to raise blood pressure and hold onto fluid.</p>
    <div class="callout">Every single step makes sense when you follow the logic. RAAS isn't a list to memorise — it's a story with a beginning, a middle, and a logical conclusion.</div>
  </div>
  <div class="rsec" id="rs1">
    <div class="stag">Section 2</div><h1>Meet the Players</h1><hr class="rdiv">
    <div class="pgrid">
      <div class="pcard" onclick="rtoggle(this)"><div class="pheader"><span class="pname">🫘 The Kidneys</span><span class="ptag tag-organ">Organ</span><span class="chev">▼</span></div><div class="pbody">JG cells sense vessel stretch as a proxy for blood pressure. Macula densa cells detect low sodium and signal JG cells to act.</div></div>
      <div class="pcard" onclick="rtoggle(this)"><div class="pheader"><span class="pname">❤️ Baroreceptors</span><span class="ptag tag-sensor">Sensor</span><span class="chev">▼</span></div><div class="pbody">Pressure sensors in the aorta and carotid arteries that signal the sympathetic nervous system to nudge JG cells to release renin.</div></div>
      <div class="pcard" onclick="rtoggle(this)"><div class="pheader"><span class="pname">🩸 The Liver</span><span class="ptag tag-organ">Organ</span><span class="chev">▼</span></div><div class="pbody">Produces angiotensinogen — an inactive precursor waiting to be activated by renin.</div></div>
      <div class="pcard" onclick="rtoggle(this)"><div class="pheader"><span class="pname">🫁 The Lungs</span><span class="ptag tag-organ">Organ</span><span class="chev">▼</span></div><div class="pbody">Produce ACE, which converts Angiotensin I into the powerful Angiotensin II.</div></div>
      <div class="pcard" onclick="rtoggle(this)"><div class="pheader"><span class="pname">🔺 Adrenal Cortex</span><span class="ptag tag-organ">Organ</span><span class="chev">▼</span></div><div class="pbody">Releases aldosterone in response to Angiotensin II, acting on kidney tubules to retain sodium and water.</div></div>
    </div>
    <div class="subhead">Key Molecules</div>
    <table class="mtable">
      <tr><th>Molecule</th><th>Source</th><th>Role</th></tr>
      <tr><td>Renin</td><td>JG cells</td><td>Starts the cascade</td></tr>
      <tr><td>Angiotensinogen</td><td>Liver</td><td>Raw material</td></tr>
      <tr><td>Angiotensin I</td><td>Blood</td><td>Inactive intermediate</td></tr>
      <tr><td>Angiotensin II</td><td>Lungs (ACE)</td><td>Active messenger</td></tr>
      <tr><td>Aldosterone</td><td>Adrenal cortex</td><td>Retains Na⁺ and water</td></tr>
      <tr><td>ADH</td><td>Posterior pituitary</td><td>Water retention</td></tr>
    </table>
  </div>
  <div class="rsec" id="rs2">
    <div class="stag">Section 3</div><h1>The Cascade, Step by Step</h1><hr class="rdiv">
    <div class="steps">
      <div class="step"><div class="sleft"><div class="snum">1</div><div class="sline"></div></div><div class="scontent"><div class="stitle">Something triggers the alarm</div><div class="sbody">Drop in BP, low tubular sodium, or sympathetic activation.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">2</div><div class="sline"></div></div><div class="scontent"><div class="stitle">JG cells release Renin</div><div class="sbody">An enzyme that acts on angiotensinogen.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">3</div><div class="sline"></div></div><div class="scontent"><div class="stitle">Renin → Angiotensin I</div><div class="sbody">Still inactive — a package not yet opened.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">4</div><div class="sline"></div></div><div class="scontent"><div class="stitle">ACE → Angiotensin II</div><div class="sbody">The main active messenger of the cascade.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">5</div><div class="sline"></div></div><div class="scontent"><div class="stitle">Angiotensin II acts on three pathways</div><div class="sbody">Vasoconstriction, aldosterone release, and ADH/thirst signaling.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">6</div><div class="sline"></div></div><div class="scontent"><div class="stitle">Aldosterone → Na⁺ reabsorption</div><div class="sbody">Water follows, blood volume and pressure rise.</div></div></div>
      <div class="step"><div class="sleft"><div class="snum">7</div></div><div class="scontent"><div class="stitle">Negative feedback shuts it down</div><div class="sbody">Restored BP and sodium silence JG cells. System powers down.</div></div></div>
    </div>
  </div>
  <div class="rsec" id="rs3">
    <div class="stag">Section 4</div><h1>The Big Picture</h1><hr class="rdiv">
    <p>The full cascade flows from three triggers → JG cells → Renin → Angiotensin I → Angiotensin II → three simultaneous effects → blood pressure restored → negative feedback shuts it down.</p>
  </div>
  <div class="rsec" id="rs4">
    <div class="stag">Section 5</div><h1>Bringing It Home</h1><hr class="rdiv">
    <div class="takelist">
      <div class="take"><div class="ticon">💡</div><div><div class="tlabel">The big idea</div><div class="ttext">RAAS answers when blood volume and pressure drop too low.</div></div></div>
      <div class="take"><div class="ticon">🔗</div><div><div class="tlabel">A cascade</div><div class="ttext">One trigger sets off a chain reaction across kidneys, liver, lungs, adrenal cortex, and brain.</div></div></div>
      <div class="take"><div class="ticon">⚡</div><div><div class="tlabel">Angiotensin II is the powerhouse</div><div class="ttext">Three simultaneous actions: vasoconstriction, aldosterone release, and ADH/thirst signaling.</div></div></div>
      <div class="take"><div class="ticon">↻</div><div><div class="tlabel">Self-correcting</div><div class="ttext">Restored BP and sodium shut the system down via negative feedback.</div></div></div>
    </div>
    <div class="closing">RAAS is one of the most clinically relevant systems in human physiology.</div>
  </div>
</div>
<script>
function rshow(i){document.querySelectorAll('.rsec').forEach((s,idx)=>s.classList.toggle('active',idx===i));document.querySelectorAll('.rnav-btn').forEach((b,idx)=>b.classList.toggle('active',idx===i));document.getElementById('rprogfill').style.width=((i+1)/5*100)+'%';}
function rtoggle(card){const body=card.querySelector('.pbody');const isOpen=body.classList.contains('open');document.querySelectorAll('.pbody').forEach(b=>b.classList.remove('open'));document.querySelectorAll('.pcard').forEach(c=>c.classList.remove('open'));if(!isOpen){body.classList.add('open');card.classList.add('open');}}
</script>`
  }
};

const STARTER_QUESTIONS = {
  "Acid-Base Balance":{
    type:"explain",
    concept:"pH homeostasis",
    question:"Why must the body maintain blood pH within such a narrow range, and what happens at the cellular level when this range is disrupted?",
    keyPoints:[
      "Enzymes and proteins are highly sensitive to pH — even small deviations alter their shape and function.",
      "Excitable tissues depend on precise ion gradients that are destabilized by pH shifts.",
      "Oxygen delivery is affected — pH shifts the oxyhemoglobin dissociation curve.",
      "Even a small pH change represents a large change in H+ concentration because the scale is logarithmic."
    ],
    reachingQuestion:"What is the relationship between hydrogen ion concentration and pH?",
    advancingQuestion:"How do the three buffer systems work together to defend pH?"
  }
};

export default function App() {
  const [system,setSystem]=useState(null);
  const [tab,setTab]=useState("practice");
  const [levelId,setLevelId]=useState("remember");
  const [histories,setHistories]=useState({});
  const [currentQ,setCurrentQ]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [levelNudge,setLevelNudge]=useState(null);

  const level=LEVELS.find(l=>l.id===levelId);

  function getHistory(sys,lvl){return histories[`${sys}__${lvl}`]||[];}
  function addHistory(sys,lvl,entry){
    const key=`${sys}__${lvl}`;
    setHistories(h=>({...h,[key]:[...(h[key]||[]),entry]}));
  }

  function getRememberAccuracy(sys){
    const hist=getHistory(sys,"remember");
    if(hist.length<5)return null;
    const correct=hist.filter(h=>h.correct===true).length;
    return Math.round((correct/hist.length)*100);
  }

  function logEvent(eventType,data){
    const studentId=getStudentId();
    const sessionId=getSessionId();
    const payload={student_id:studentId,session_id:sessionId,event_type:eventType,timestamp:new Date().toISOString(),...data};
    console.log("EVENT:",payload);
    logToSupabase({student_id:studentId,session_id:sessionId,...data});
  }

  async function fetchQuestion(sys,lvl,hist,forcedPrompt=null){
    setLoading(true);setError(null);setCurrentQ(null);setFeedback(null);
    try {
      const prompt=forcedPrompt||buildPrompt(sys,lvl,hist);
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})
      });
      const data=await res.json();
      const raw=data.content?.map(b=>b.text||"").join("")||"";
      const clean=raw.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setCurrentQ(parsed);
    } catch(e){setError("Could not generate question. Please try again.");}
    setLoading(false);
  }

  function selectSystem(sys){
    setSystem(sys);setTab(TUTORIALS[sys]?"learn":"practice");setLevelId("remember");setLevelNudge(null);
    logEvent("system_selected",{system:sys});
    const starter=STARTER_QUESTIONS[sys];
    if(starter){setCurrentQ(starter);setFeedback(null);setError(null);}
    else fetchQuestion(sys,LEVELS[0],[]);
  }

  function selectLevel(lvl){
    setLevelId(lvl.id);setCurrentQ(null);setFeedback(null);setLevelNudge(null);
    if(lvl.id!=="remember"){
      const accuracy=getRememberAccuracy(system);
      if(accuracy!==null&&accuracy<90){setLevelNudge({accuracy,targetLevel:lvl});return;}
    }
    const hist=getHistory(system,lvl.id);
    fetchQuestion(system,lvl,hist);
  }

  function handleResult(correct,studentAnswer,status){
    const entry={
      question:currentQ?.question||currentQ?.task||currentQ?.cards?.[0]?.q||"question",
      concept:currentQ?.concept||levelId,
      correct,studentAnswer,status
    };
    addHistory(system,levelId,entry);
    logEvent("question_answered",{system,level:levelId,concept:entry.concept,correct,status,question:entry.question});
    const updatedHist=[...getHistory(system,levelId),entry];
    setCurrentQ(null);
    fetchQuestion(system,level,updatedHist);
  }

  function handleFeedbackNext(useFollowUp){
    const hist=getHistory(system,levelId);
    if(useFollowUp&&feedback?.followUp){
      const fp=`You are an adaptive physiology tutor. Generate ONE question based on this follow-up prompt. Return ONLY valid JSON (same format as before): "${feedback.followUp}"`;
      fetchQuestion(system,level,hist,fp);
    } else {fetchQuestion(system,level,hist);}
    setFeedback(null);
  }

  const hist=system?getHistory(system,levelId):[];
  const correct=hist.filter(h=>h.correct===true).length;
  const wrong=hist.filter(h=>h.correct===false).length;

  if(!system){
    return (
      <div style={{padding:"2rem 1rem"}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <h2 style={{fontSize:18,fontWeight:500,marginBottom:4}}>Physiology Learning Suite</h2>
        <p style={{color:"var(--color-text-secondary)",marginBottom:24,fontSize:14}}>Adaptive questions across all 6 levels of Bloom's Taxonomy. Select a body system to begin.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
          {SYSTEMS.map(s=><button key={s} onClick={()=>selectSystem(s)} style={{padding:"1rem",borderRadius:10,textAlign:"center",fontWeight:500,fontSize:14,minHeight:64,cursor:"pointer"}}>{s}</button>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:"1.5rem 1rem"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <button onClick={()=>{setSystem(null);setCurrentQ(null);}} style={{fontSize:13,padding:"4px 10px"}}>← Systems</button>
        <span style={{fontWeight:500,fontSize:16}}>{system}</span>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {TUTORIALS[system]&&(
          <button onClick={()=>setTab("learn")} style={{padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:tab==="learn"?500:400,background:tab==="learn"?"#2C2C2A":"var(--color-background-secondary)",color:tab==="learn"?"#fff":"var(--color-text-primary)",border:tab==="learn"?"none":"0.5px solid var(--color-border-secondary)",cursor:"pointer"}}>
            📖 Learn
          </button>
        )}
        <button onClick={()=>{setTab("practice");if(!currentQ){const lvl=LEVELS.find(l=>l.id===levelId);selectLevel(lvl);}}} style={{padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:tab==="practice"?500:400,background:tab==="practice"?"#2C2C2A":"var(--color-background-secondary)",color:tab==="practice"?"#fff":"var(--color-text-primary)",border:tab==="practice"?"none":"0.5px solid var(--color-border-secondary)",cursor:"pointer"}}>
          🧠 Practice
        </button>
      </div>

      {tab==="learn"&&TUTORIALS[system]&&(
        <div style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:16,marginBottom:12}}>
          <div dangerouslySetInnerHTML={{__html:TUTORIALS[system].html}}/>
        </div>
      )}
      {tab==="learn"&&TUTORIALS[system]&&(
        <button onClick={()=>setTab("practice")} style={{marginBottom:16,fontWeight:500}}>Ready to practice →</button>
      )}

      {tab==="practice"&&(
        <>
          <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
            {LEVELS.map(l=>{
              const h=getHistory(system,l.id);
              const active=l.id===levelId;
              return (
                <button key={l.id} onClick={()=>selectLevel(l)}
                  style={{padding:"6px 12px",fontSize:13,borderRadius:20,background:active?l.color:"var(--color-background-secondary)",color:active?"#fff":"var(--color-text-primary)",border:active?"none":"0.5px solid var(--color-border-secondary)",fontWeight:active?500:400,cursor:"pointer"}}>
                  {l.label}{h.length>0&&!active?` (${h.length})`:""}</button>
              );
            })}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:level.color}}/>
              <span style={{fontWeight:500,fontSize:15}}>{level.label}</span>
            </div>
            <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:10}}>{level.desc}</p>
            {hist.length>0&&(
              <div style={{display:"flex",gap:16,fontSize:13,color:"var(--color-text-secondary)",marginBottom:8}}>
                <span style={{color:"#1D9E75"}}>✓ {correct} correct</span>
                <span style={{color:"#D85A30"}}>✗ {wrong} needs work</span>
                <span>{hist.length} attempted</span>
              </div>
            )}
            <ProgressDots history={hist}/>
          </div>

          {levelNudge&&(
            <div style={{border:"1.5px solid #EF9F27",borderRadius:12,padding:16,marginBottom:16,background:"#EF9F2718"}}>
              <p style={{fontWeight:500,fontSize:14,color:"#EF9F27",marginBottom:8}}>A quick note before you move up</p>
              <p style={{fontSize:14,lineHeight:1.6,color:"var(--color-text-primary)",marginBottom:12}}>
                You've answered Remembering questions correctly {levelNudge.accuracy}% of the time. Building a stronger foundation — closer to 90% — will make the higher levels feel more manageable. That said, the choice is yours.
              </p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>{setLevelNudge(null);const hist=getHistory(system,levelNudge.targetLevel.id);fetchQuestion(system,levelNudge.targetLevel,hist);}} style={{fontSize:13,padding:"7px 14px"}}>
                  I understand — move up anyway
                </button>
                <button onClick={()=>{setLevelNudge(null);setLevelId("remember");fetchQuestion(system,LEVELS[0],getHistory(system,"remember"));}} style={{fontSize:13,padding:"7px 14px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:8}}>
                  Keep building at Remembering
                </button>
              </div>
            </div>
          )}

          <div style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:20,minHeight:200}}>
            {loading&&<Spinner msg="Generating question..."/>}
            {error&&(
              <div>
                <p style={{color:"var(--color-text-danger)",fontSize:14,marginBottom:8}}>{error}</p>
                <button onClick={()=>fetchQuestion(system,level,hist)}>Try again</button>
              </div>
            )}
            {!loading&&!error&&currentQ&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
                  <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",border:"0.5px solid var(--color-border-tertiary)"}}>
                    {currentQ.concept||level.label}
                  </span>
                  <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Question {hist.length+1}</span>
                </div>
                {currentQ.type==="mcq"&&<MCQQuestion q={currentQ} onResult={handleResult}/>}
                {currentQ.type==="explain"&&<ExplainQuestion q={currentQ} onResult={handleResult}/>}
                {currentQ.type==="case"&&<CaseQuestion q={currentQ} onResult={handleResult}/>}
                {(currentQ.type==="flashcard"||currentQ.cards)&&<FlashCards data={currentQ} onResult={handleResult}/>}
              </div>
            )}
          </div>

          {!loading&&currentQ&&(
            <div style={{marginTop:12}}>
              <button onClick={()=>fetchQuestion(system,level,hist)} style={{fontSize:13,padding:"5px 12px"}}>
                Skip → next question
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
