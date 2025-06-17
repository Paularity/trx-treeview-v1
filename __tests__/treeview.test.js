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
    .replace('<script src="https://cdn.tailwindcss.com"></script>', '')
    .replace('<link rel="stylesheet" href="treeview.css" />', '')
    .replace('jquery.min.js', 'file://' + jqueryPath)
    .replace('treeview.js', 'file://' + treeviewPath);
  dom = new JSDOM(inline, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost'
  });
  await new Promise(resolve =>
    dom.window.addEventListener('load', () => setTimeout(resolve, 0))
  );
});

test('tree renders root nodes', () => {
  const rootNodes = dom.window.document.querySelectorAll('.tv-item[data-level="0"]');
  expect(rootNodes.length).toBe(2);
});

test('clicking a node filters document list', () => {
  const label = [...dom.window.document.querySelectorAll('.tv-label')].find(el => el.textContent === '2200 - Leach Project');
  label.click();
  const rows = dom.window.document.querySelectorAll('#docTableBody tr');
  expect(rows.length).toBe(2);
});

test('addProject adds a new root node', () => {
  dom.window.prompt = jest.fn().mockReturnValue('New Project');
  const before = dom.window.document.querySelectorAll('.tv-item[data-level="0"]').length;
  dom.window.addProject();
  const after = dom.window.document.querySelectorAll('.tv-item[data-level="0"]').length;
  expect(after).toBe(before + 1);
});

test('newly added project is selected', () => {
  dom.window.prompt = jest.fn().mockReturnValue('Selected Project');
  dom.window.addProject();
  const selected = dom.window.document.querySelector('.tv-label.selected');
  expect(selected.textContent).toBe('Selected Project');
});

test('addProject updates dropdown', () => {
  dom.window.prompt = jest.fn().mockReturnValue('Dropdown Project');
  dom.window.addProject();
  dom.window.openDocModal();
  const options = [...dom.window.document.querySelectorAll('#docProject option')].map(o => o.value);
  expect(options).toContain('Dropdown Project');
  dom.window.closeModal();
});

test('node click selects the node', () => {
  const label = dom.window.document.querySelector('.tv-label');
  label.click();
  expect(label.classList.contains('selected')).toBe(true);
});

test('toggle explorer button hides and shows explorer', () => {
  const explorer = dom.window.document.querySelector('.explorer');
  const btn = dom.window.document.getElementById('toggleExplorer');
  btn.click();
  expect(explorer.classList.contains('hidden')).toBe(true);
  btn.click();
  expect(explorer.classList.contains('hidden')).toBe(false);
});
