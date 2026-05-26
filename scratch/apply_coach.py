import re
import subprocess

# Restore first to guarantee we operate on a pristine git state
# subprocess.run(["git", "restore", "public/index.html"])

with open("public/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Navigation tab: next to Skin Store
target_nav = """      <div class="topbar-tab" id="tab-store" onclick="toggleMainView('store')">Skins Store</div>"""
replacement_nav = """      <div class="topbar-tab" id="tab-store" onclick="toggleMainView('store')">Skins Store</div>
      <div class="topbar-tab" id="tab-coach" onclick="toggleMainView('coach')">Draft Coach</div>"""

if target_nav in content:
    content = content.replace(target_nav, replacement_nav, 1)
    print("Success: Navigation tab added!")
else:
    print("Error: Target navigation block not found!")

# 2. Add custom CSS styles: right before </style> in clean file
target_css_end = """/* lineups and crosshairs CSS removed */
</style>"""

replacement_css = """/* Draft Comp Coach Styles */
.dc-slot-card {
  flex: 1;
  min-width: 90px;
  max-width: 110px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dc-slot-card:hover {
  border-color: var(--accentborder);
  background: rgba(250, 68, 84, 0.04);
  transform: translateY(-2px);
}
.dc-slot-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--muted);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: all 0.2s ease;
}
.dc-slot-card:hover .dc-slot-avatar {
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 0 10px var(--accentdim);
}
.dc-slot-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dc-slot-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Comp bar tracks */
.dc-track-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}
.dc-fill-bar {
  height: 100%;
  border-radius: 3px;
  width: 0;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.dc-fill-bar.duelists { background: #ff5757; box-shadow: 0 0 6px rgba(255,87,87,0.3); }
.dc-fill-bar.initiators { background: #ffd700; box-shadow: 0 0 6px rgba(255,215,0,0.3); }
.dc-fill-bar.controllers { background: #00d4e0; box-shadow: 0 0 6px rgba(0,212,224,0.3); }
.dc-fill-bar.sentinels { background: #3ecf8e; box-shadow: 0 0 6px rgba(62,207,142,0.3); }

.dc-insight-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
  border-left: 3px solid transparent;
}
.dc-insight-card.good {
  background: rgba(62, 207, 142, 0.04);
  border-color: var(--win);
  color: #fff;
}
.dc-insight-card.warn {
  background: rgba(250, 68, 84, 0.04);
  border-color: var(--loss);
  color: #fff;
}
.dc-insight-card-icon {
  font-size: 14px;
}
</style>"""

if target_css_end in content:
    content = content.replace(target_css_end, replacement_css, 1)
    print("Success: CSS styles added!")
else:
    print("Error: Target CSS block not found!")

# 3. Add HTML View container: right before toast container
target_html = """<div class="toast" id="toast"></div>"""
replacement_html = """  <!-- DRAFT COMPOSITION COACH VIEW -->
  <div id="coach-view" style="display:none; padding: 24px; max-width: 1400px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, rgba(250, 68, 84, 0.12) 0%, rgba(20, 20, 22, 0.45) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px;">
      <h2 style="font-family:'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; color: #fff; letter-spacing: 1.5px; margin: 0;">VCT Draft Coach & Synergy Board</h2>
      <p style="font-size: 13px; color: var(--muted); margin: 0; max-width: 700px;">Draft 5-agent team compositions for any active Valorant map. Our real-time coaching heuristics engine evaluates role balances, maps suitability, and triggers synergies to flag tactical vulnerabilities before you queue.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 28px;" class="store-grid">
      <!-- LEFT PANEL: Draft Roster & Map Selector -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="section-label visible" style="margin-bottom: 0;">
          <span class="sl-text">Draft Composition Board</span>
          <div class="sl-line"></div>
        </div>

        <div class="card" style="padding: 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 12px; display:flex; flex-direction:column; gap:16px; margin: 0;">
          <div>
            <label style="font-family:'Barlow Condensed', sans-serif; font-size: 11px; color: var(--muted); text-transform: uppercase; display: block; margin-bottom: 6px;">Select Tactical Map</label>
            <select id="dc-map-select" onchange="evaluateDraft()" style="width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.5); color: #fff; font-size: 13px; outline: none; cursor: pointer;">
              <option value="ascent">Ascent</option>
              <option value="bind">Bind</option>
              <option value="haven">Haven</option>
              <option value="split">Split</option>
              <option value="breeze">Breeze</option>
              <option value="sunset">Sunset</option>
              <option value="lotus">Lotus</option>
              <option value="icebox">Icebox</option>
              <option value="abyss">Abyss</option>
            </select>
          </div>

          <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; margin-bottom: 4px;">Selected Agent Draft</div>
          <div style="display: flex; justify-content: space-around; gap: 10px; flex-wrap: wrap;">
            <div class="dc-slot-card" onclick="openDraftSelector(0)">
              <div id="dc-slot-avatar-0" class="dc-slot-avatar">➕</div>
              <div id="dc-slot-name-0" class="dc-slot-name">Slot 1</div>
            </div>
            <div class="dc-slot-card" onclick="openDraftSelector(1)">
              <div id="dc-slot-avatar-1" class="dc-slot-avatar">➕</div>
              <div id="dc-slot-name-1" class="dc-slot-name">Slot 2</div>
            </div>
            <div class="dc-slot-card" onclick="openDraftSelector(2)">
              <div id="dc-slot-avatar-2" class="dc-slot-avatar">➕</div>
              <div id="dc-slot-name-2" class="dc-slot-name">Slot 3</div>
            </div>
            <div class="dc-slot-card" onclick="openDraftSelector(3)">
              <div id="dc-slot-avatar-3" class="dc-slot-avatar">➕</div>
              <div id="dc-slot-name-3" class="dc-slot-name">Slot 4</div>
            </div>
            <div class="dc-slot-card" onclick="openDraftSelector(4)">
              <div id="dc-slot-avatar-4" class="dc-slot-avatar">➕</div>
              <div id="dc-slot-name-4" class="dc-slot-name">Slot 5</div>
            </div>
          </div>

          <button class="fetch-btn" style="width: 100%; margin-top: 10px; margin-bottom: 0;" onclick="resetDraftComp()">↻ Clear Current Draft</button>
        </div>
      </div>

      <!-- RIGHT PANEL: Heuristics review board -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="section-label visible" style="margin-bottom: 0;">
          <span class="sl-text">Tactical Coach Verdict</span>
          <div class="sl-line"></div>
        </div>

        <div class="card" style="padding: 20px; border-radius: 16px; border: 1px solid var(--border); display:flex; flex-direction:column; gap:16px; margin: 0;">
          <div style="display:flex; align-items:center; gap:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:16px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; box-shadow: 0 0 16px rgba(250, 68, 84, 0.1);">
              <div id="dc-score-meter" style="font-family:'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 900; color: var(--muted);">0</div>
              <div style="font-size: 8px; color: var(--muted); text-transform:uppercase; font-weight:bold;">SCORE</div>
            </div>
            <div>
              <div id="dc-verdict-title" style="font-family:'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; color:#fff; text-transform:uppercase;">Incomplete Draft</div>
              <p id="dc-verdict-desc" style="font-size: 11px; color: var(--muted); margin: 4px 0 0 0; max-width: 320px;">Add 5 agents to evaluate the comp synergy and receive coaching advice.</p>
            </div>
          </div>

          <div>
            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:12px; text-transform:uppercase; color:#fff; margin-bottom:12px;">📊 Role Allocations</h4>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div>
                <div style="display:flex; justify-content:space-between; font-size: 10px; font-family:'DM Mono', monospace; color: var(--muted); margin-bottom: 2px;"><span>Duelists</span><span id="dc-bar-duelists-txt">0 / 2</span></div>
                <div class="dc-track-bar"><div id="dc-bar-duelists" class="dc-fill-bar duelists" style="width: 0%"></div></div>
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; font-size: 10px; font-family:'DM Mono', monospace; color: var(--muted); margin-bottom: 2px;"><span>Initiators</span><span id="dc-bar-initiators-txt">0 / 1</span></div>
                <div class="dc-track-bar"><div id="dc-bar-initiators" class="dc-fill-bar initiators" style="width: 0%"></div></div>
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; font-size: 10px; font-family:'DM Mono', monospace; color: var(--muted); margin-bottom: 2px;"><span>Controllers (Smokes)</span><span id="dc-bar-controllers-txt">0 / 1</span></div>
                <div class="dc-track-bar"><div id="dc-bar-controllers" class="dc-fill-bar controllers" style="width: 0%"></div></div>
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; font-size: 10px; font-family:'DM Mono', monospace; color: var(--muted); margin-bottom: 2px;"><span>Sentinels (Flank watch)</span><span id="dc-bar-sentinels-txt">0 / 1</span></div>
                <div class="dc-track-bar"><div id="dc-bar-sentinels" class="dc-fill-bar sentinels" style="width: 0%"></div></div>
              </div>
            </div>
          </div>

          <div>
            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:12px; text-transform:uppercase; color:#fff; margin-bottom:12px;">⚡ Draft Analysis Insights</h4>
            <div id="dc-insights-wrap" style="display:flex; flex-direction:column; gap:8px;">
              <div style="font-size:11px; color:var(--muted); text-align:center; padding:16px;">Insights panel will fill once draft is parsed.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stat-modal-overlay" id="dc-agent-modal" onclick="if(event.target===this)closeDraftSelector()">
      <div class="stat-modal" style="max-width: 580px; border-color: rgba(255,255,255,0.08); background: #0c0c0f; border-radius: 16px;">
        <div class="stat-modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
          <div class="stat-modal-title" style="font-size: 18px; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">Select Draft Agent</div>
          <button class="stat-modal-close" onclick="closeDraftSelector()">✕</button>
        </div>
        <div class="stat-modal-body" style="padding: 16px 0; max-height: 400px; overflow-y: auto;">
          <div id="dc-agent-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px;"></div>
        </div>
      </div>
    </div>
  </div>

<div class="toast" id="toast"></div>"""

if target_html in content:
    content = content.replace(target_html, replacement_html, 1)
    print("Success: HTML layout containers added!")
else:
    print("Error: Target HTML view not found!")

# 4. Add JavaScript Heuristics logic: right before checkUrlParams call at DomContentLoaded
target_js_block = """// --- LINEUPS & CROSSHAIRS JS LOGIC REMOVED ---"""
replacement_js = """// ── TEAM DRAFT COACH ENGINE ──

let draftSlots = [null, null, null, null, null];
let activeSlotIndex = null;

const draftMapRecommendations = {
  ascent: { preferred: ['sova', 'killjoy', 'jett', 'omen'], note: 'Sova & Killjoy are top tier on Ascent due to wallbangable areas and clear lane angles.' },
  bind: { preferred: ['brimstone', 'viper', 'raze', 'cypher'], note: 'Brimstone & Viper double controller provides excellent map control. Raze is phenomenal in hookey/showers.' },
  haven: { preferred: ['killjoy', 'sova', 'jett', 'omen'], note: 'Cypher or Killjoy are essential to hold Haven three-site setup. Omen is highly favored for garage plays.' },
  split: { preferred: ['raze', 'viper', 'cypher', 'omen'], note: 'Viper + Omen double controller excels at locking down mid.' },
  breeze: { preferred: ['viper', 'sova', 'jett', 'cypher'], note: 'Viper is an absolute must-pick on Breeze. Sova is essential for open sites information.' },
  sunset: { preferred: ['cypher', 'gekko', 'clove', 'breach'], note: 'Sunset favors heavy initiator utility setups. Gekko is incredibly strong for default plant coverage.' },
  lotus: { preferred: ['killjoy', 'viper', 'omen', 'fade'], note: 'Double controller or heavy initiator pressure dominates Lotus three-site layout.' },
  icebox: { preferred: ['viper', 'killjoy', 'jett', 'sova'], note: 'Viper is essential on Icebox A-screen control. Killjoy secures B yellow default anchors.' },
  abyss: { preferred: ['omen', 'cypher', 'jett', 'sova'], note: 'Cypher traps excel on flank bridges. Omen teleports cross gaps easily.' }
};

function openDraftSelector(slotIndex) {
  activeSlotIndex = slotIndex;
  document.getElementById('dc-agent-modal').classList.add('open');
  renderDraftAgentList();
}

function closeDraftSelector() {
  document.getElementById('dc-agent-modal').classList.remove('open');
  activeSlotIndex = null;
}

function renderDraftAgentList() {
  const container = document.getElementById('dc-agent-list');
  if (!container) return;
  container.innerHTML = '';

  const allAgents = Object.keys(AGENT_UUIDS);
  allAgents.forEach(ag => {
    const iconUrl = getAgentIconUrl(ag);
    const agKey = ag.toLowerCase();
    
    if (draftSlots.includes(agKey)) return;

    const div = document.createElement('div');
    div.className = 'player-card';
    div.style.cursor = 'pointer';
    div.style.padding = '10px';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.border = '1px solid rgba(255,255,255,0.05)';
    div.style.borderRadius = '4px';
    div.onclick = () => selectDraftAgent(agKey);
    div.innerHTML = `
      ${iconUrl ? `<img src="${iconUrl}" style="width:32px; height:32px; border-radius:50%; margin-bottom:4px;">` : '<div style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center;">👤</div>'}
      <div style="font-family:'Barlow Condensed', sans-serif; font-size:11px; font-weight:800; color:#fff; text-transform:uppercase; text-align:center;">${ag}</div>
    `;
    container.appendChild(div);
  });
}

function selectDraftAgent(agKey) {
  if (activeSlotIndex === null) return;
  draftSlots[activeSlotIndex] = agKey;
  
  const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);
  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);
  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
  
  slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
  slotName.innerText = agKey.toUpperCase();
  
  closeDraftSelector();
  evaluateDraft();
}

function resetDraftComp() {
  draftSlots = [null, null, null, null, null];
  for (let i = 0; i < 5; i++) {
    document.getElementById(`dc-slot-avatar-${i}`).innerHTML = '➕';
    document.getElementById(`dc-slot-name-${i}`).innerText = `Slot ${i+1}`;
  }
  evaluateDraft();
}

function evaluateDraft() {
  const selected = draftSlots.filter(s => s !== null);
  const total = selected.length;
  
  const scoreMeter = document.getElementById('dc-score-meter');
  const verdictTitle = document.getElementById('dc-verdict-title');
  const verdictDesc = document.getElementById('dc-verdict-desc');
  const insightsWrap = document.getElementById('dc-insights-wrap');

  let duelists = 0, initiators = 0, controllers = 0, sentinels = 0;
  selected.forEach(ag => {
    const role = getRoleClass(ag.charAt(0).toUpperCase() + ag.slice(1));
    if (role === 'duelist') duelists++;
    else if (role === 'initiator') initiators++;
    else if (role === 'controller') controllers++;
    else if (role === 'sentinel') sentinels++;
  });

  document.getElementById('dc-bar-duelists-txt').innerText = `${duelists} / 2`;
  document.getElementById('dc-bar-duelists').style.width = `${Math.min((duelists/2)*100, 100)}%`;
  
  document.getElementById('dc-bar-initiators-txt').innerText = `${initiators} / 1`;
  document.getElementById('dc-bar-initiators').style.width = `${Math.min((initiators/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-controllers-txt').innerText = `${controllers} / 1`;
  document.getElementById('dc-bar-controllers').style.width = `${Math.min((controllers/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-sentinels-txt').innerText = `${sentinels} / 1`;
  document.getElementById('dc-bar-sentinels').style.width = `${Math.min((sentinels/1)*100, 100)}%`;

  if (total < 5) {
    scoreMeter.innerText = total * 10;
    scoreMeter.style.color = 'var(--muted)';
    verdictTitle.innerText = 'Drafting in progress...';
    verdictDesc.innerText = `Selected ${total} out of 5 agents. Add more to get a full tactical evaluation.`;
    insightsWrap.innerHTML = `<div style="font-size:11px; color:var(--muted); text-align:center; padding:16px;">Draft is incomplete. Fill slots to trigger composition analysis.</div>`;
    return;
  }

  let score = 70;
  const insights = [];
  const mapKey = document.getElementById('dc-map-select').value;
  const mapRecs = draftMapRecommendations[mapKey] || { preferred: [], note: '' };

  if (controllers === 0) {
    score -= 20;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Critical Deficit — No Controller Smokes:</strong> Playing without smokes blocks entrance vision, exposing your entry duelists to passive sniper defense.' });
  } else if (controllers === 2) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Tactical Controller Synergy:</strong> Double smokes controller setups afford exceptional mid-round flexibility and delay utility.' });
  }

  if (sentinels === 0) {
    score -= 15;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Open Flanks Warning:</strong> Composition lacks a Sentinel traps setup. Defending flanks verbally or wet-peeking corners is highly risky.' });
  } else {
    score += 5;
    insights.push({ type: 'good', icon: '🛡️', text: '<strong>Sentinel Anchor Bonus:</strong> Solid defensive site locks. Passive traps defend flanks automatically.' });
  }

  if (duelists === 0) {
    score -= 10;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Entry Deficit:</strong> Lacking a high-mobility duelist. Pushing sites through chokepoints becomes harder without entry mobility.' });
  } else if (duelists > 2) {
    score -= 10;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Utility Deficit — Triple Duelists:</strong> Excess of entry agents trades off valuable initiator scans and control smokes.' });
  }

  let mapMatches = 0;
  selected.forEach(ag => {
    if (mapRecs.preferred.includes(ag)) {
      mapMatches++;
    }
  });

  if (mapMatches >= 3) {
    score += 15;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Elite Map Suitability:</strong> Matches the meta layout of ${mapKey.toUpperCase()}. ${mapRecs.note}` });
  } else if (mapMatches >= 1) {
    score += 5;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Decent Map Layout Suitability.</strong> ${mapRecs.note}` });
  }

  if (selected.includes('jett') && selected.includes('breach')) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Entry Flash Synergy — Jett + Breach:</strong> Fault-line stun or flash supports Jett dash entries on target spots perfectly.' });
  }
  if (selected.includes('viper') && selected.includes('brimstone') && ['bind', 'haven'].includes(mapKey)) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Post-Plant Molly Synergy — Viper + Brimstone:</strong> Double line post-plant delay holds off defuses for up to 15 seconds!' });
  }

  score = Math.max(0, Math.min(score, 100));
  
  scoreMeter.innerText = score;
  if (score >= 85) {
    scoreMeter.style.color = 'var(--win)';
    verdictTitle.innerText = 'Meta Composition';
    verdictTitle.style.color = 'var(--win)';
    verdictDesc.innerText = 'Exceptional draft. Balanced role allocations, strong synergies, and high suitability for this map outline.';
  } else if (score >= 70) {
    scoreMeter.style.color = 'var(--accent)';
    verdictTitle.innerText = 'Decent Composition';
    verdictTitle.style.color = 'var(--accent)';
    verdictDesc.innerText = 'Good average balance. Solid role slots filled, though minor weaknesses or card tweaks can optimize entries.';
  } else {
    scoreMeter.style.color = 'var(--loss)';
    verdictTitle.innerText = 'Sub-optimal Composition';
    verdictTitle.style.color = 'var(--loss)';
    verdictDesc.innerText = 'Weak draft stability. Missing controllers, Sentinels, or map picks makes site executes difficult.';
  }

  insightsWrap.innerHTML = insights.map(i => `
    <div class="dc-insight-card ${i.type}">
      <span class="dc-insight-card-icon">${i.icon}</span>
      <div>${i.text}</div>
    </div>
  `).join('');
}"""

if target_js_block in content:
    content = content.replace(target_js_block, replacement_js, 1)
    print("Success: JavaScript logic engines added!")
else:
    print("Error: Target JS placeholder not found!")

# 5. Update toggleMainView(view) logic to support 'coach' tab
target_toggle = """  // Hide all views first
  document.getElementById('tracker-view').style.display = 'none';
  document.getElementById('esports-view').style.display = 'none';
  document.getElementById('store-view').style.display = 'none';"""

replacement_toggle = """  // Hide all views first
  document.getElementById('tracker-view').style.display = 'none';
  document.getElementById('esports-view').style.display = 'none';
  document.getElementById('store-view').style.display = 'none';
  const cView = document.getElementById('coach-view');
  if (cView) cView.style.display = 'none';"""

if target_toggle in content:
    content = content.replace(target_toggle, replacement_toggle, 1)
    print("Success: toggleMainView hide block added!")
else:
    print("Error: Target toggle view hide not found!")

target_toggle_routes = """  } else if (view === 'store') {
    document.getElementById('store-view').style.display = 'block';
    document.querySelector('.player-search-wrap').style.display = 'none';
    document.getElementById('fetch-btn').style.display = 'none';
    const h2hb = document.getElementById('h2h-trigger-btn');
    if (h2hb) h2hb.style.display = 'none';
    
    if(esportsLiveInterval) clearInterval(esportsLiveInterval);
    if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
    initStoreView();
  }"""

replacement_toggle_routes = """  } else if (view === 'store') {
    document.getElementById('store-view').style.display = 'block';
    document.querySelector('.player-search-wrap').style.display = 'none';
    document.getElementById('fetch-btn').style.display = 'none';
    const h2hb = document.getElementById('h2h-trigger-btn');
    if (h2hb) h2hb.style.display = 'none';
    
    if(esportsLiveInterval) clearInterval(esportsLiveInterval);
    if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
    initStoreView();
  } else if (view === 'coach') {
    if (cView) cView.style.display = 'block';
    document.querySelector('.player-search-wrap').style.display = 'none';
    document.getElementById('fetch-btn').style.display = 'none';
    const h2hb = document.getElementById('h2h-trigger-btn');
    if (h2hb) h2hb.style.display = 'none';
    resetDraftComp();
  }"""

if target_toggle_routes in content:
    content = content.replace(target_toggle_routes, replacement_toggle_routes, 1)
    print("Success: toggleMainView route for coach added!")
else:
    print("Error: Target toggle route for store not found!")

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(content)
