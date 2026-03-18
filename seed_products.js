const Database = require('./server/models/Database.js');

async function seedProducts() {
    console.log("Initializing DB for seeding...");
    await Database.init();

    const products = [
        {
            category: "Digital Illustration",
            title: "Cyberpunk Cityscape Premium Pack",
            description: "High-resolution cyberpunk cityscape illustrations including day and night variants.",
            price_inr: 499,
            image_url: "https://via.placeholder.com/600x400/1a1a2e/e94560?text=Cyberpunk+City",
            file_url: "https://example.com/download/cyberpunk-pack.zip",
            is_active: 1
        },
        {
            category: "Character Design",
            title: "Fantasy RPG Character Base",
            description: "Fully customizable layered PSD file with 5 base fantasy classes (Warrior, Mage, Rogue, Cleric, Ranger).",
            price_inr: 899,
            image_url: "https://via.placeholder.com/600x400/0f3460/e94560?text=Fantasy+Characters",
            file_url: "https://example.com/download/fantasy-base.psd",
            is_active: 1
        },
        {
            category: "2D Animation",
            title: "Lo-Fi Animation Loop Kit",
            description: "A collection of 3 seamless lo-fi animation loops perfect for streams or videos (MP4, 1080p).",
            price_inr: 1299,
            image_url: "https://via.placeholder.com/600x400/16213e/0f3460?text=Lo-Fi+Loops",
            file_url: "https://example.com/download/lofi-loops.zip",
            is_active: 1
        },
        {
            category: "Concept Art",
            title: "Sci-Fi Mech Concept Art Bundle",
            description: "A bundle of 10 high-quality sci-fi mech concept art pieces. Great for inspiration and reference.",
            price_inr: 799,
            image_url: "https://via.placeholder.com/600x400/4c3b4d/a53860?text=Sci-Fi+Mechs",
            file_url: "https://example.com/download/mech-bundle.zip",
            is_active: 1
        }
    ];

    console.log("Clearing old products...");
    // Optional: clear existing products for testing
    // await Database.run('DELETE FROM products');

    console.log("Seeding products...");
    for (const p of products) {
        await Database.createProduct(p);
        console.log(`Seeded: ${p.title}`);
    }

    console.log("Seed complete!");
}

seedProducts().catch(console.error);
