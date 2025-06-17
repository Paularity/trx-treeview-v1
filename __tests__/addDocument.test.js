const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let dom;

beforeAll(async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'EDMS.html'), 'utf-8');
  const jqueryPath = path.resolve(require.resolve('jquery/dist/jquery.min.js'));
  const treeviewPath = path.resolve(path.join(__dirname, '..', 'treeview.js'));
  const inline = html
    .replace('<script src="tailwindstub.js"></script>', '')
    .replace('<link rel="stylesheet" href="tailwind.css"/>', '')
    .replace('<link rel="stylesheet" href="treeview.css"/>', '')
    .replace('jquery.min.js', 'file://' + jqueryPath)
    .replace('treeview.js', 'file://' + treeviewPath);
  dom = new JSDOM(inline, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost' });
  await new Promise((resolve) => {
    dom.window.addEventListener('load', () => setTimeout(resolve, 0));
  });
});

test('project dropdown contains existing projects', () => {
  const { window } = dom;
  window.openDocModal();
  const options = [...window.document.querySelectorAll('#docProject option')].map(o => o.value);
  expect(options).toEqual(
    expect.arrayContaining([
      '2200 - Leach Project',
      '2200-01 - Assembly',
      '2300 - Mining Project'
    ])
  );
  window.closeModal();
});

test('modal selects current project when opening', () => {
  const { window } = dom;
  const label = [...window.document.querySelectorAll('.tv-label')].find(
    el => el.textContent === '2300 - Mining Project'
  );
  label.click();
  window.openDocModal();
  expect(window.document.getElementById('docProject').value).toBe(
    '2300 - Mining Project'
  );
  window.closeModal();
});

test('adding a document updates the table and list', () => {
  const { window } = dom;
  const initialLen = window.documents.length;
  window.openDocModal();
  window.document.getElementById('docProject').value = '2200 - Leach Project';
  window.document.getElementById('docTitle').value = 'Test Doc';
  window.document.getElementById('docCode').value = 'TST';
  window.document.getElementById('docVersion').value = '1';
  const form = window.document.getElementById('docForm');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  expect(window.documents.length).toBe(initialLen + 1);
  const lastRow = window.document.querySelector('#docTableBody').lastElementChild;
  expect(lastRow.firstElementChild.textContent).toBe('2200 - Leach Project');
});

test('selection persists after adding a document', () => {
  const { window } = dom;
  const label = [...window.document.querySelectorAll('.tv-label')].find(
    (el) => el.textContent === '2200 - Leach Project'
  );
  label.click();
  window.openDocModal();
  window.document.getElementById('docProject').value = '2200 - Leach Project';
  window.document.getElementById('docTitle').value = 'Persist';
  window.document.getElementById('docCode').value = 'PRS';
  window.document.getElementById('docVersion').value = '1';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const selected = window.document.querySelector('.tv-label.selected');
  expect(selected.textContent).toBe('2200 - Leach Project');
});

test('adding a document for a new project adds a tree node', () => {
  const { window } = dom;
  window.openDocModal();
  const newProj = '2400 - New Node';
  const select = window.document.getElementById('docProject');
  const opt = window.document.createElement('option');
  opt.value = newProj;
  opt.textContent = newProj;
  select.appendChild(opt);
  select.value = newProj;
  window.document.getElementById('docTitle').value = 'Doc';
  window.document.getElementById('docCode').value = 'DOC';
  window.document.getElementById('docVersion').value = '1';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const labels = [...window.document.querySelectorAll('.tv-label')].map(
    (el) => el.textContent
  );
  expect(labels).toContain(newProj);
});

test('adding a document for a new child nests it under the correct root', () => {
  const { window } = dom;
  window.openDocModal();
  const newProj = '2200-03 - Nested';
  const select = window.document.getElementById('docProject');
  const opt = window.document.createElement('option');
  opt.value = newProj;
  opt.textContent = newProj;
  select.appendChild(opt);
  select.value = newProj;
  window.document.getElementById('docTitle').value = 'Nest';
  window.document.getElementById('docCode').value = 'NST';
  window.document.getElementById('docVersion').value = '1';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const root = window.findProject('2200 - Leach Project');
  const childNames = root.nodes.map(n => n.text);
  expect(childNames).toContain(newProj);
});

test('child document appears when parent is selected', () => {
  const { window } = dom;
  window.openDocModal();
  window.document.getElementById('docProject').value = '2200-01 - Assembly';
  window.document.getElementById('docTitle').value = 'Child Doc';
  window.document.getElementById('docCode').value = 'CHD';
  window.document.getElementById('docVersion').value = '1';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const parent = [...window.document.querySelectorAll('.tv-label')].find(
    (el) => el.textContent === '2200 - Leach Project'
  );
  parent.click();
  const rows = [...window.document.querySelectorAll('#docTableBody tr')];
  const titles = rows.map((r) => r.children[1].textContent);
  expect(titles).toContain('Child Doc');
});

test('child document appears when child node is selected', () => {
  const { window } = dom;
  const child = [...window.document.querySelectorAll('.tv-label')].find(
    (el) => el.textContent === '2200-01 - Assembly'
  );
  child.click();
  const rows = [...window.document.querySelectorAll('#docTableBody tr')];
  const titles = rows.map((r) => r.children[1].textContent);
  expect(titles).toContain('Child Doc');
});

test('clicking a row shows document details', () => {
  const { window } = dom;
  const row = window.document.querySelector('#docTableBody').lastElementChild;
  row.click();
  expect(window.document.getElementById('docDetails').textContent).toContain('Child Doc');
});

test('editing a document updates the table', () => {
  const { window } = dom;
  window.editDoc(0);
  window.document.getElementById('docTitle').value = 'Updated Doc';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const firstRowTitle = window.document.querySelector('#docTableBody tr').children[1].textContent;
  expect(firstRowTitle).toBe('Updated Doc');
});

test('deleteDoc removes a document', () => {
  const { window } = dom;
  const initial = window.documents.length;
  window.confirm = jest.fn().mockReturnValue(true);
  window.deleteDoc(0);
  expect(window.documents.length).toBe(initial - 1);
  const rows = window.document.querySelectorAll('#docTableBody tr');
  expect(rows.length).toBe(initial - 1);
});

test('tree shows stored projects on reload', async () => {
  const { window } = dom;
  window.openDocModal();
  const newProj = '3000 - Persisted';
  const select = window.document.getElementById('docProject');
  const opt = window.document.createElement('option');
  opt.value = newProj;
  opt.textContent = newProj;
  select.appendChild(opt);
  select.value = newProj;
  window.document.getElementById('docTitle').value = 'Persist';
  window.document.getElementById('docCode').value = 'PST';
  window.document.getElementById('docVersion').value = '1';
  window.document.getElementById('docForm').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true })
  );
  const stored = window.localStorage.getItem('edmsDocs');

  const html = fs.readFileSync(path.join(__dirname, '..', 'EDMS.html'), 'utf-8');
  const jqueryPath = path.resolve(require.resolve('jquery/dist/jquery.min.js'));
  const treeviewPath = path.resolve(path.join(__dirname, '..', 'treeview.js'));
  const inline = html
    .replace('<script src="tailwindstub.js"></script>', '')
    .replace('<link rel="stylesheet" href="tailwind.css"/>', '')
    .replace('<link rel="stylesheet" href="treeview.css"/>', '')
    .replace('jquery.min.js', 'file://' + jqueryPath)
    .replace('treeview.js', 'file://' + treeviewPath);
  const dom2 = new JSDOM(inline, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost',
    beforeParse(win) {
      win.localStorage.setItem('edmsDocs', stored);
    },
  });
  await new Promise((resolve) => {
    dom2.window.addEventListener('load', () => setTimeout(resolve, 0));
  });
  const labels = [...dom2.window.document.querySelectorAll('.tv-label')].map((l) => l.textContent);
  expect(labels).toContain(newProj);
});
