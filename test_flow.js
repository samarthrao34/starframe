const http = require('http');

async function testFlow() {
    try {
        console.log('--- Starting API Flow Test ---');

        // 1. Register User
        const uniqueEmail = `test_${Date.now()}@starframe.com`;
        console.log(`Registering user: ${uniqueEmail}`);

        let sessionCookie = '';

        const regRes = await fetch('http://localhost:3001/api/client/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'API Tester',
                email: uniqueEmail,
                password: 'password123'
            })
        });

        const regData = await regRes.json();
        console.log('Registration Response:', regData);

        const setCookie = regRes.headers.get('set-cookie');
        if (setCookie) {
            sessionCookie = setCookie.split(';')[0];
            console.log('Session acquired:', sessionCookie);
        } else {
            console.error('Failed to get session cookie');
            return;
        }

        // 2. Create Commission
        console.log('\\nCreating Commission...');
        const commRes = await fetch('http://localhost:3001/api/commissions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                name: 'API Tester',
                email: uniqueEmail,
                phone: '1234567890',
                location: 'Test City',
                service: '2d-animation',
                budget: '2500-8000',
                timeline: 'standard',
                purpose: 'personal',
                description: 'Test commission from API script',
                gst: false
            })
        });

        const commText = await commRes.text();
        console.log(`Commission API Status: ${commRes.status}`);
        console.log(`Raw Response: ${commText.substring(0, 500)}`);

    } catch (e) {
        console.error('Test execution error:', e);
    }
}

testFlow();
