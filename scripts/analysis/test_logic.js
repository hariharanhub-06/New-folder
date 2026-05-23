function test(url) {
    const parts = url.split('/');
    console.log('Parts:', parts);
    const domain = parts.slice(0, 4).join('/');
    const rest = '/' + parts.slice(4).join('/');
    console.log('Domain:', domain);
    console.log('Rest:', rest);
    return `${domain}/tr:w-100${rest}`;
}

console.log(test('https://ik.imagekit.io/6k5vfwl1j/products/image.jpg'));
