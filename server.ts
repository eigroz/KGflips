import express from 'express';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const port = 3000;

app.use(express.json());

// API route to push to GitHub with token
app.post('/api/git/push', async (req, res) => {
  const { pat } = req.body;
  if (!pat || typeof pat !== 'string') {
    return res.status(400).json({ error: 'GitHub Personal Access Token is required.' });
  }

  const cleanPat = pat.trim().replace(/^['"]|['"]$/g, '');

  try {
    const remoteUrl = `https://${cleanPat}@github.com/eigroz/KGflips.git`;
    
    // Ensure all changes are committed
    try {
      await execAsync('git add . && git commit -m "feat: sync KGflips updates"');
    } catch {
      // It is okay if there is nothing new to commit
    }

    // Push to GitHub main branch
    const { stdout, stderr } = await execAsync(`git push -u "${remoteUrl}" main --force`);
    console.log('[Git Push Success]', stdout, stderr);
    
    return res.json({ 
      success: true, 
      message: 'Successfully pushed KGflips to https://github.com/eigroz/KGflips.git!',
      output: stdout || stderr 
    });
  } catch (err: any) {
    console.error('[Git Push Error]', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to push to GitHub. Please check that the token has repo write access.' 
    });
  }
});

// Git status API
app.get('/api/git/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('git status --short');
    return res.json({ status: stdout || 'Clean' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

start();
