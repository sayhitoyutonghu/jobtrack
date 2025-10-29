const fs = require('fs').promises;
const path = require('path');

class PersistentCache {
  constructor({ filePath, defaultTtlMs = 7 * 24 * 60 * 60 * 1000 }) {
    this.filePath = filePath;
    this.defaultTtlMs = defaultTtlMs;
    this.data = new Map();
    this._loaded = false;
  }

  async ensureLoaded() {
    if (this._loaded) return;
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      const now = Date.now();
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === 'object' && typeof v.expiresAt === 'number') {
          if (v.expiresAt > now) {
            this.data.set(k, v);
          }
        }
      }
    } catch (e) {
      // File may not exist yet; that's fine
    } finally {
      this._loaded = true;
    }
  }

  async save() {
    const obj = Object.create(null);
    for (const [k, v] of this.data.entries()) {
      obj[k] = v;
    }
    await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2));
  }

  async get(key) {
    await this.ensureLoaded();
    const rec = this.data.get(key);
    if (!rec) return null;
    if (rec.expiresAt <= Date.now()) {
      this.data.delete(key);
      await this.save();
      return null;
    }
    return rec.value;
  }

  async set(key, value, ttlMs) {
    await this.ensureLoaded();
    const expiresAt = Date.now() + (Number.isFinite(ttlMs) ? ttlMs : this.defaultTtlMs);
    this.data.set(key, { value, expiresAt });
    await this.save();
  }

  async prune() {
    await this.ensureLoaded();
    const now = Date.now();
    let changed = false;
    for (const [k, v] of this.data.entries()) {
      if (!v || v.expiresAt <= now) {
        this.data.delete(k);
        changed = true;
      }
    }
    if (changed) await this.save();
  }
}

module.exports = PersistentCache;


