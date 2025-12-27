const fs = require('fs');

async function checkPage() {
    try {
        console.log('Fetching http://localhost:3000/shop?tag=formal-shirts ...');
        const res = await fetch('http://localhost:3000/shop?tag=formal-shirts', {
            cache: 'no-store'
        });
        const html = await res.text();

        console.log(`Status: ${res.status}`);
        console.log(`HTML Length: ${html.length}`);

        // Extract product names using a simple regex (assuming h3 class structure from typical ProductCard)
        // Adjust regex based on actual component structure if needed
        // Assuming ProductCard renders name in an h3 or similar
        // Let's look for known product names

        const knownProducts = ["test_again", "Acid wash baggy shirt", "Baggy shoe"];

        knownProducts.forEach(p => {
            const count = (html.match(new RegExp(p, "gi")) || []).length;
            console.log(`Visible count for "${p}": ${count}`);
        });

        // Also just dump the first 500 chars of body to see if it's correct page
        // console.log(html.substring(html.indexOf('<main'), html.indexOf('<main') + 500));

    } catch (e) {
        console.error(e);
    }
}

checkPage();
