class TreeView {
  constructor(el, options = {}) {
    this.el = el;
    this.data = options.data || [];
    this.onNodeClick = options.onNodeClick || function () {};
    this.selectedEl = null;
    this.render();
  }

  render() {
    this.el.innerHTML = '';
    this.el.classList.add('treeview');
    const root = this._buildNodes(this.data);
    this.el.appendChild(root);
  }

  _buildNodes(nodes, level = 0) {
    const ul = document.createElement('ul');
    ul.classList.add('tv-list');
    nodes.forEach(node => {
      const li = document.createElement('li');
      li.classList.add('tv-item');
      li.dataset.level = level;
      const span = document.createElement('span');
      span.textContent = node.text;
      span.classList.add('tv-label');
      span.setAttribute('tabindex', '0');
      span.onclick = (e) => {
        e.stopPropagation();
        this.onNodeClick(node);
        if (li.classList.contains('tv-collapsed')) {
          li.classList.remove('tv-collapsed');
        } else {
          li.classList.add('tv-collapsed');
        }
        if (this.selectedEl) {
          this.selectedEl.classList.remove('selected');
        }
        span.classList.add('selected');
        this.selectedEl = span;
      };
      li.appendChild(span);
      if (node.nodes && node.nodes.length) {
        const child = this._buildNodes(node.nodes, level + 1);
        li.appendChild(child);
      }
      li.classList.add('tv-collapsed');
      ul.appendChild(li);
    });
    return ul;
  }
}
