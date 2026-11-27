import './style.css';

const demo = [
  {item_id:1,item_name:'Printer Head Epson T81 (ii)',category:'POS',quantity_available:6},
  {item_id:2,item_name:'Nippon Printer',category:'TVM',quantity_available:4},
  {item_id:3,item_name:'TP-Link 4G Router',category:'Server Rack',quantity_available:7},
  {item_id:4,item_name:'Controller Board',category:'ACG',quantity_available:3},
  {item_id:5,item_name:'IPC KITS',category:'TVM',quantity_available:5},
  {item_id:6,item_name:'Terminal 9A20Pro (Replacement)',category:'Handheld',quantity_available:4},
  {item_id:7,item_name:'SSD 128GB',category:'TVM',quantity_available:10},
  {item_id:8,item_name:'LED Light Bar (Top)',category:'ACG',quantity_available:8}
];
let items = demo;
let live = false;
let selected = null;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

document.querySelector('#app').innerHTML = `
<header class="topbar"><div class="container barinner"><div class="brand"><span class="brandmark">go<span>HUB</span></span><div><b>Go Hub Capital</b><small>SPARE PART REQUEST MANAGEMENT</small></div></div><span class="pill">Technician Portal</span></div></header>
<main class="container">
  <section class="hero"><span class="eyebrow">STAFF PORTAL</span><h1>Find a spare part.<br><em>Submit a request.</em></h1><p>Check available stock and record a spare part request in a few simple steps.</p></section>
  <nav class="portal-tabs" aria-label="Technician portal sections">
    <button id="tab-stock" type="button" class="portal-tab active" aria-selected="true">Spare Parts</button>
    <button id="tab-requests" type="button" class="portal-tab" aria-selected="false">My Requests</button>
  </nav>
  <section id="inventory-panel" class="panel"><div class="panelhead"><div><h2>Available Spare Parts</h2><p>Find an item by name or category.</p></div><span id="count" class="count">8 items</span></div>
  <div class="filters"><input id="search" type="search" placeholder="Search spare part or category..." aria-label="Search spare parts" /><select id="category" aria-label="Filter category"><option value="">All categories</option></select></div>
  <div id="notice" class="notice">Loading stock data...</div><div id="list" class="parts"></div></section>
  <section id="request-section" class="panel form-panel" hidden><div class="panelhead"><div><span class="eyebrow">REQUEST FORM</span><h2>Request a spare part</h2><p id="selected-item"></p></div><button type="button" id="close" class="linkbutton">Close ✕</button></div>
  <form id="request-form"><div class="fields">
    <label>Technician Name *<input name="requester_name" maxlength="100" required placeholder="Enter full name"></label>
    <label>Email Address *<input type="email" name="requester_email" maxlength="150" required placeholder="name@example.com"></label>
    <label>Phone Number *<input name="phone_number" maxlength="35" required placeholder="0123456789"></label>
    <label>Incident Ticket Number *<input name="incident_ticket_number" maxlength="80" required placeholder="SF / Jira / SpiceWork"></label>
    <label>Region *<select name="region" required><option value="">Choose region</option><option>Northern</option><option>Central</option><option>Southern</option><option>Eastern</option></select></label>
    <label>Quantity Required *<input name="quantity_requested" type="number" min="1" step="1" required value="1"></label>
    <label class="full">Problem Description *<textarea name="problem_description" maxlength="2000" required placeholder="Incident location, complainant and faulty device serial number"></textarea></label>
    <label class="full">Remark / Comment<textarea name="remark" maxlength="500" placeholder="Optional information"></textarea></label>
    <label class="full">Staff Access Code *<input name="access_code" type="password" required autocomplete="off" placeholder="Demo access code"></label>
  </div><div id="feedback" role="status" aria-live="polite"></div><button id="submit" class="primary" type="submit">Submit Spare Part Request</button></form></section>
  <section id="my-requests-panel" class="panel" hidden>
    <div class="panelhead"><div><span class="eyebrow">REQUEST MANAGEMENT</span><h2>My Requests</h2><p>View, edit or cancel your own pending requests.</p></div></div>
    <div class="manage-note">To protect requests, use the Request ID and one-time Private Management Code shown after submission. Requests created before this feature cannot be managed here. Only Pending requests can be edited or deleted.</div>
    <form id="lookup-form">
      <div class="fields">
        <label>Request ID *<input id="lookup-request-id" name="request_id" type="number" min="1" step="1" required placeholder="e.g. 101"></label>
        <label>Private Management Code *<input id="lookup-token" name="management_code" type="password" minlength="64" maxlength="64" pattern="[a-fA-F0-9]{64}" required placeholder="64-character code" autocomplete="off"></label>
      </div>
      <button type="submit" class="primary" id="find-request">Find My Request</button>
    </form>
    <div id="manage-feedback" role="status" aria-live="polite"></div>
    <div id="managed-request" hidden>
      <div id="request-summary" class="manage-summary"></div>
      <form id="edit-request-form" hidden>
        <div class="fields">
          <label>Quantity Required *<input name="quantity_requested" type="number" min="1" step="1" required></label>
          <label class="full">Problem Description *<textarea name="problem_description" maxlength="2000" required></textarea></label>
          <label class="full">Remark / Comment<textarea name="remark" maxlength="500"></textarea></label>
        </div>
        <button class="primary" type="submit" id="save-request">Save Changes</button>
        <button class="secondary-button" type="button" id="stop-editing">Cancel Editing</button>
      </form>
      <div id="manage-actions" class="manage-actions">
        <button type="button" class="primary" id="edit-request">Edit Request</button>
        <button type="button" class="danger-button" id="delete-request">Delete Request</button>
      </div>
    </div>
  </section>
</main><footer>Go Hub Capital · Stock Request Management System · Assignment demo</footer>`;

function render() {
  const categories = [...new Set(items.map(i => i.category))].sort();
  const select = $('#category'); const before = select.value;
  select.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  select.value = before;
  const query = $('#search').value.trim().toLowerCase();
  const filtered = items.filter(x => (!select.value || x.category === select.value) && (`${x.item_name} ${x.category}`.toLowerCase().includes(query)));
  $('#count').textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  $('#list').innerHTML = filtered.length ? filtered.map(i => `<div class="part"><div class="particon">▣</div><div class="partname"><b>${escapeHtml(i.item_name)}</b><small>${escapeHtml(i.category)}</small></div><div class="stock"><b>${i.quantity_available}</b><small>available</small></div><button class="requestbtn" data-id="${i.item_id}" ${i.quantity_available===0?'disabled':''}>Request</button></div>`).join('') : '<div class="empty">No spare parts matched your search.</div>';
  document.querySelectorAll('.requestbtn').forEach(button => button.addEventListener('click', () => openForm(Number(button.dataset.id))));
}
function openForm(id) {
  selected = items.find(i => i.item_id === id);
  if (!selected) return;
  $('#request-form').reset(); $('#feedback').replaceChildren();
  $('#selected-item').textContent = `${selected.item_name} · ${selected.quantity_available} available`;
  $('#request-form').elements.quantity_requested.max = selected.quantity_available;
  $('#request-section').hidden = false;
  $('#request-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function showTab(name) {
  const showStock = name === 'stock';
  $('#inventory-panel').hidden = !showStock;
  $('#my-requests-panel').hidden = showStock;
  if (!showStock) $('#request-section').hidden = true;
  else if (selected) $('#request-section').hidden = false;
  $('#tab-stock').classList.toggle('active', showStock);
  $('#tab-requests').classList.toggle('active', !showStock);
  $('#tab-stock').setAttribute('aria-selected', String(showStock));
  $('#tab-requests').setAttribute('aria-selected', String(!showStock));
}
$('#tab-stock').addEventListener('click', () => showTab('stock'));
$('#tab-requests').addEventListener('click', () => showTab('requests'));
$('#close').addEventListener('click',()=>{ $('#request-section').hidden = true; selected = null; });
$('#search').addEventListener('input',render);
$('#category').addEventListener('change',render);
$('#request-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = $('#request-form');
  const output = $('#feedback');
  if (!live) {output.className='error';output.textContent='Preview mode: submissions will work after Vercel and Supabase are connected.';return;}
  const body = Object.fromEntries(new FormData(f));
  body.item_id = selected.item_id;
  body.quantity_requested = Number(body.quantity_requested);
  const button = $('#submit');button.disabled=true;button.textContent='Submitting...';
  try {
    const response = await fetch('/api/requests', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    output.className='success';
    output.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = `Request #${result.request_id} saved successfully. Status: Pending.`;
    output.append(heading);
    if (result.management_code) {
      const note = document.createElement('p');
      note.textContent = 'IMPORTANT: Save your Private Management Code now. It is shown only once and cannot be retrieved later.';
      const token = document.createElement('code');
      token.className = 'management-token';
      token.textContent = result.management_code;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'secondary-button';
      copy.textContent = 'Copy Management Code';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(result.management_code); copy.textContent = 'Copied'; }
        catch { copy.textContent = 'Copy manually from the code above'; }
      });
      const idNote = document.createElement('p');
      idNote.textContent = `For My Requests, use Request ID: ${result.request_id}`;
      output.append(note, token, copy, idNote);
    }
    f.reset();
  } catch(err) {output.className='error';output.textContent=err.message;}
  finally {button.disabled=false;button.textContent='Submit Spare Part Request';}
});
// STEP 10B: My Requests UI uses the same-origin Vercel API; never query Supabase directly.
let activeRequest = null;
let access = null; // kept only in this browser tab's memory; not saved in browser storage
function setManageFeedback(message, kind = '') {
  const box = $('#manage-feedback');
  box.className = kind;
  box.textContent = message;
}
function setBusy(button, busy, whenBusy, whenReady) {
  button.disabled = busy;
  button.textContent = busy ? whenBusy : whenReady;
}
async function manageRequest(body) {
  const response = await fetch('/api/manage', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body), cache: 'no-store'
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('Server returned an invalid response'); }
  if (!response.ok) throw new Error(result.error || 'Unable to manage request');
  return result;
}
function forgetManagedRequest() {
  activeRequest = null;
  access = null;
  $('#managed-request').hidden = true;
  $('#edit-request-form').hidden = true;
  $('#manage-actions').hidden = false;
  $('#request-summary').replaceChildren();
}
function displayManagedRequest(record) {
  activeRequest = record;
  $('#managed-request').hidden = false;
  $('#edit-request-form').hidden = true;
  const pending = record.request_status === 'Pending';
  $('#manage-actions').hidden = !pending;
  const grid = [
    ['Request ID', record.request_id], ['Status', record.request_status],
    ['Item ID', record.item_id], ['Quantity', record.quantity_requested],
    ['Technician', record.requester_name], ['Email', record.requester_email],
    ['Phone', record.phone_number], ['Ticket Number', record.incident_ticket_number],
    ['Region', record.region], ['Problem Description', record.problem_description],
    ['Remark', record.remark || '—'], ['Submitted', record.request_date]
  ];
  const summary = $('#request-summary');
  summary.replaceChildren();
  const title = document.createElement('h3'); title.textContent = 'Request Details'; summary.append(title);
  const dl = document.createElement('dl');
  for (const [label, value] of grid) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = String(value ?? '—');
    dl.append(dt, dd);
  }
  summary.append(dl);
  const form = $('#edit-request-form');
  form.elements.quantity_requested.value = record.quantity_requested;
  form.elements.problem_description.value = record.problem_description;
  form.elements.remark.value = record.remark || '';
  if (!pending) setManageFeedback('This request is not Pending and cannot be edited or deleted.');
}
$('#lookup-form').addEventListener('submit', async e => {
  e.preventDefault();
  forgetManagedRequest();
  setManageFeedback('');
  const request_id = Number($('#lookup-request-id').value);
  const management_code = $('#lookup-token').value.trim().toLowerCase();
  if (!Number.isSafeInteger(request_id) || request_id <= 0 || !/^[a-f0-9]{64}$/.test(management_code)) {
    setManageFeedback('Enter a valid Request ID and the complete 64-character Management Code.', 'error');
    return;
  }
  const button = $('#find-request'); setBusy(button, true, 'Searching...', 'Find My Request');
  try {
    const result = await manageRequest({action:'read', request_id, management_code});
    access = {request_id, management_code};
    displayManagedRequest(result.request);
    setManageFeedback('Request found.', 'success');
  } catch (err) {setManageFeedback(err.message, 'error');}
  finally {setBusy(button, false, 'Searching...', 'Find My Request');}
});
$('#edit-request').addEventListener('click', () => {
  if (!activeRequest || activeRequest.request_status !== 'Pending') return;
  $('#edit-request-form').hidden = false;
  $('#manage-actions').hidden = true;
  setManageFeedback('Edit the fields, then click Save Changes.');
});
$('#stop-editing').addEventListener('click', () => {
  $('#edit-request-form').hidden = true;
  $('#manage-actions').hidden = false;
  setManageFeedback('Editing cancelled.');
});
$('#edit-request-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!activeRequest || !access) return;
  const form = e.currentTarget;
  const quantity_requested = Number(form.elements.quantity_requested.value);
  const problem_description = form.elements.problem_description.value.trim();
  const remark = form.elements.remark.value.trim();
  if (!Number.isSafeInteger(quantity_requested) || quantity_requested < 1 || !problem_description) {
    setManageFeedback('Enter a valid quantity and problem description.', 'error'); return;
  }
  const button = $('#save-request'); setBusy(button, true, 'Saving...', 'Save Changes');
  try {
    const result = await manageRequest({...access, action:'update', quantity_requested, problem_description, remark});
    displayManagedRequest(result.request);
    setManageFeedback('Request updated successfully.', 'success');
  } catch (err) {setManageFeedback(err.message, 'error');}
  finally {setBusy(button, false, 'Saving...', 'Save Changes');}
});
$('#delete-request').addEventListener('click', async () => {
  if (!activeRequest || !access) return;
  if (!window.confirm(`Permanently delete Request #${activeRequest.request_id}? This cannot be undone.`)) return;
  const button = $('#delete-request'); setBusy(button, true, 'Deleting...', 'Delete Request');
  try {
    const id = activeRequest.request_id;
    await manageRequest({...access, action:'delete'});
    forgetManagedRequest();
    $('#lookup-form').reset();
    setManageFeedback(`Request #${id} deleted successfully.`, 'success');
  } catch (err) {setManageFeedback(err.message, 'error');}
  finally {setBusy(button, false, 'Deleting...', 'Delete Request');}
});

async function load() {
  try {
    const response = await fetch('/api/items', {headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid API data');
    items=data.items;live=true;
    $('#notice').hidden=true;
  } catch {
    $('#notice').textContent='PREVIEW MODE: Showing 8 sample items. Deploy on Vercel and configure Supabase to display live stock and save requests.';
    $('#notice').hidden=false;
  }
  render();
}
load();
