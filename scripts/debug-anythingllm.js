
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const API_URL = process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001';
const API_KEY = process.env.ANYTHINGLLM_API_KEY;

// QDrant default URL
const QDRANT_URL = 'http://localhost:6333';

if (!API_KEY) {
    console.error('FATAL: ANYTHINGLLM_API_KEY is not set in .env.local');
    // If we can't read .env, we can't proceed with API calls
    console.log('Please ensure ANYTHIGNLLM_API_KEY is set in d:\\Projects\\AIASTRO\\.env.local');
}

async function debugAnythingLLM() {
    console.log('==================================================');
    console.log('       AIASTRO ANYTHINGLLM DEBUGGER TOOL          ');
    console.log('==================================================');
    console.log(`API URL: ${API_URL}`);
    console.log(`QDRANT : ${QDRANT_URL}`);
    console.log('--------------------------------------------------');

    // 1. Check QDrant Connectivity
    console.log('\n[1/4] Checking Vector Database (QDrant)...');
    try {
        const qdrantRes = await axios.get(`${QDRANT_URL}/collections`);
        console.log('✅ QDrant is reachable!');
        console.log('   Collections:', qdrantRes.data.result.map(c => c.name).join(', '));
    } catch (err) {
        console.error('❌ QDrant Connection Failed:', err.message);
        console.log('   (Ignore this if you are using a managed Vector DB or internal Docker network only)');
    }

    if (!API_KEY) {
        console.log('\nCannot proceed with AnythingLLM checks without API Key.');
        return;
    }

    // 2. Check AnythingLLM Connectivity & Workspaces
    console.log('\n[2/4] Checking AnythingLLM Workspaces...');
    let limitWorkspace = null;
    try {
        const workspacesRes = await axios.get(`${API_URL}/api/v1/workspaces`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        });

        const workspaces = workspacesRes.data.workspaces || [];
        console.log(`✅ Connected! Found ${workspaces.length} workspaces.`);

        for (const ws of workspaces) {
            console.log(`\n   📂 Workspace: "${ws.name}"`);
            console.log(`      Slug: ${ws.slug}`);
            console.log(`      ID:   ${ws.id}`);
            limitWorkspace = ws; // Just verify one for deep dive
        }
    } catch (err) {
        console.error('❌ AnythingLLM Connection Failed:', err.message);
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', JSON.stringify(err.response.data));
        }
        return;
    }

    if (!limitWorkspace) {
        console.log('No workspaces found to debug.');
        return;
    }

    // 3. Deep Dive into Workspace Content
    console.log(`\n[3/4] Inspecting Workspace "${limitWorkspace.name}"...`);
    try {
        // Detailed lookup
        const wsDetailRes = await axios.get(`${API_URL}/api/v1/workspace/${limitWorkspace.slug}`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        });
        const details = wsDetailRes.data.workspace?.[0] || wsDetailRes.data.workspace;

        console.log('   --- Statistics ---');
        // Some versions expose vector count or document count here
        // console.log(JSON.stringify(details, null, 2));

        // List Documents
        console.log('   --- Documents in System ---');
        const docsRes = await axios.get(`${API_URL}/api/v1/documents`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        });

        const allDocs = flattenDocs(docsRes.data.localFiles?.items || docsRes.data.documents || []);
        const contextDocs = allDocs.filter(d => d.title && d.title.includes('user-context'));

        if (contextDocs.length > 0) {
            console.log(`   Found ${contextDocs.length} user-context documents:`);
            contextDocs.forEach(d => console.log(`   - 📄 ${d.title} (ID: ${d.id}, Location: ${d.location})`));
        } else {
            console.log('   ⚠️ No "user-context" documents found in the entire system.');
        }

    } catch (err) {
        console.error('   ❌ Failed to inspect workspace:', err.message);
    }

    // 4. Test Chat Response
    console.log(`\n[4/4] Testing Vector Retrieval (Chat)...`);
    try {
        const chatRes = await axios.post(`${API_URL}/api/v1/workspace/${limitWorkspace.slug}/chat`, {
            message: "What is my birth place and date of birth?",
            mode: "query"
        }, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        });

        console.log(`   🤖 Bot Response: "${chatRes.data.textResponse}"`);

        if (chatRes.data.sources && chatRes.data.sources.length > 0) {
            console.log('   ✅ Sources Used:');
            chatRes.data.sources.forEach(s => {
                console.log(`      - [Score: ${s.score.toFixed(3)}] ${s.title}`);
                console.log(`        Chunk: ${s.chunk.substring(0, 50)}...`);
            });
        } else {
            console.log('   ⚠️ NO SOURCES USED. The bot could not retrieve any vector information.');
            console.log('   POSSIBLE CAUSES:');
            console.log('   1. Initial embedding failed.');
            console.log('   2. Documents are uploaded but not "linked" to workspace.');
            console.log('   3. EMBEDDING MODEL MISMATCH (Common with QDrant + standard vectors).');
            console.log('      Solution: Delete the workspace and recreate it to reset the vector collection.');
        }

    } catch (chatErr) {
        console.error('   ❌ Chat Test Failed:', chatErr.message);
    }
}

function flattenDocs(items) {
    let files = [];
    if (!Array.isArray(items)) return [];
    for (const item of items) {
        if (item.type === 'file' || !item.items) {
            files.push(item);
        } else if (item.type === 'folder' || item.items) {
            files = [...files, ...flattenDocs(item.items)];
        }
    }
    return files;
}

debugAnythingLLM();
