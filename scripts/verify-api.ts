
import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('RESPONSE IS VALID JSON');
            if (Array.isArray(json)) {
                console.log(`COUNT: ${json.length}`);
                if (json.length > 0) {
                    const first = json[0];
                    console.log('SAMPLE FIRST PROJECT:');
                    console.log(`- ID: ${first.id}`);
                    console.log(`- Name: ${first.name}`);
                    console.log(`- OwnerId (Root): ${first.ownerId}`);
                    console.log(`- Owner (Nested): ${JSON.stringify(first.owner)}`);
                }
            } else {
                console.log('RESPONSE IS NOT AN ARRAY:', data.substring(0, 200));
            }
        } catch (e) {
            console.log('RESPONSE IS NOT JSON:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
