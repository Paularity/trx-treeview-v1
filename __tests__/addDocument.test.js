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
    .replace('<link rel="stylesheet" href="treeview.css"/>', '')
    .replace('node_modules/jquery/dist/jquery.min.js', 'file://' + jqueryPath)
    .replace('treeview.js', 'file://' + treeviewPath);
  dom = new JSDOM(inline, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost' });
  await new Promise((resolve) => {
    dom.window.addEventListener('load', resolve);
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
