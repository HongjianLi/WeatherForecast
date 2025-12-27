document.addEventListener('DOMContentLoaded', async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const date = urlParams.get('date');
	const srcCity = urlParams.get('srcCity');
	const dstCity = urlParams.get('dstCity');
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
		const no = row[2];
		const price = row[9];
		if (!lowestPrice[no] || price < lowestPrice[no]) {
			lowestPrice[no] = price; // Save the lowest price.
			tr.classList.add('table-primary');
		}
		tbody.appendChild(tr);
	});
});
