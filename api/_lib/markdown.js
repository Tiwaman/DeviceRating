const { marked } = require('marked');

marked.setOptions({
  gfm: true,
  breaks: true
});

function parseMarkdown(md) {
  return marked.parse(md || '');
}

module.exports = { parseMarkdown };
