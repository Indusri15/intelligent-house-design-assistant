const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_DIR = path.join(__dirname, '../../data/store');

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

class FallbackCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(STORE_DIR, `${name}.json`);
    this.init();
  }

  init() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading ${this.name}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error writing ${this.name}:`, err);
    }
  }

  async find(query = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const [k, v] of Object.entries(query)) {
        if (typeof v === 'object' && v !== null && '$ne' in v) {
          if (item[k] === v.$ne) return false;
        } else if (item[k] !== v) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    if (!id) return null;
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: doc._id || crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newDoc);
    this._write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const updated = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    this._write(items);
    return updated;
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const removed = items.splice(index, 1)[0];
    this._write(items);
    return removed;
  }

  async deleteMany(query = {}) {
    const items = this._read();
    const remaining = items.filter(item => {
      for (const [k, v] of Object.entries(query)) {
        if (item[k] === v) return false;
      }
      return true;
    });
    this._write(remaining);
    return { deletedCount: items.length - remaining.length };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

const db = {
  users: new FallbackCollection('users'),
  projects: new FallbackCollection('projects'),
  floorPlans: new FallbackCollection('floorPlans'),
  designSelections: new FallbackCollection('designSelections'),
  vastuResults: new FallbackCollection('vastuResults'),
  materialRates: new FallbackCollection('materialRates'),
  labourRates: new FallbackCollection('labourRates'),
  costEstimates: new FallbackCollection('costEstimates'),
  constructionStages: new FallbackCollection('constructionStages'),
  expenses: new FallbackCollection('expenses'),
  aiJobs: new FallbackCollection('aiJobs'),
  generatedDesigns: new FallbackCollection('generatedDesigns')
};

module.exports = db;
