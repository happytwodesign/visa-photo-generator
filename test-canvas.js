const { createCanvas } = require('canvas');

const canvas = createCanvas(200, 200);
const ctx = canvas.getContext('2d');

ctx.font = '30px Arial';
ctx.fillText('Hello World', 50, 100);

console.log('Canvas created successfully!');