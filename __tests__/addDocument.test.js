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

test('adding a document updates the table and list', () => {
  const { window } = dom;
  const initialLen = window.documents.length;
  window.openDocModal();
  window.document.getElementById('docProject').value = 'Test Project';
  window.document.getElementById('docTitle').value = 'Test Doc';
  window.document.getElementById('docCode').value = 'TST';
  window.document.getElementById('docVersion').value = '1';
  const form = window.document.getElementById('docForm');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  expect(window.documents.length).toBe(initialLen + 1);
  const lastRow = window.document.querySelector('#docTableBody').lastElementChild;
  expect(lastRow.firstElementChild.textContent).toBe('Test Project');
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
