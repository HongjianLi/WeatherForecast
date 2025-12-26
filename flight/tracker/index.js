document.addEventListener('DOMContentLoaded', async () => {
	const date = '2026-01-12';
	const srcCity = '广州';
	const dstCity = '西双版纳';
	const response = await fetch(`${date}-${srcCity}-${dstCity}.tsv`);
	console.assert(response.ok);
	const rows = (await response.text()).split('\n').slice(0, -1).map(line => line.split('	')); // The last row is an empty line.
	const tbody = document.getElementById('tbody');
	const lowestPrice = {};
	rows.forEach(row => {
		const tr = document.createElement('tr');
		row.forEach((col, idx) => {
			const td = document.createElement('td');
			const text = document.createTextNode(col);
			td.appendChild(text);
			tr.appendChild(td);
		});
		const no = row[1];
		const price = row[8];
		if (!lowestPrice[no] || price < lowestPrice[no]) {
			lowestPrice[no] = price; // Save the lowest price.
			tr.classList.add('table-primary');
		}
		tbody.appendChild(tr);
	});
});
