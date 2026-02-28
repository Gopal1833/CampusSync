const fs = require('fs');

// 1. Remove Student Panel in index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// The student dashboard section begins with: <!-- ========== STUDENT DASHBOARD ========== -->
// And we need to remove until we find the modals section: <!-- Add Student Modal -->
let idxStart = html.indexOf('<!-- ========== STUDENT DASHBOARD ========== -->');
let idxEnd = html.indexOf('<!-- ========== MODALS ========== -->', idxStart);
if (idxStart !== -1 && idxEnd !== -1) {
    html = html.substring(0, idxStart) + html.substring(idxEnd);
}

// Remove Submit Homework Modal
let modStart = html.indexOf('<!-- Submit Homework Modal -->');
let modEnd = html.indexOf('</div>\n    </div>\n', modStart);
if (modStart !== -1 && modEnd !== -1) {
    html = html.substring(0, modStart) + html.substring(modEnd + 15); // crude adjust
}

// Remove Add Homework Modal just in case if it's there
let addHwStart = html.indexOf('<!-- Add Homework Modal -->');
if (addHwStart !== -1) {
    let addHwEnd = html.indexOf('</div>\n    </div>\n', addHwStart);
    if (addHwEnd !== -1) {
        html = html.substring(0, addHwStart) + html.substring(addHwEnd + 15);
    }
}

fs.writeFileSync('public/index.html', html);
console.log('Removed Student Panel from HTML');
