// Test adapter only. Production always uses MongoDB through server/db.js.
export function memoryDatabase() {
  const collections = new Map();
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => value && typeof value === 'object' && '$ne' in value ? doc[key] !== value.$ne : doc[key] === value);
  return { collection(name) {
    if (!collections.has(name)) collections.set(name, []);
    const documents = collections.get(name);
    const update = (doc, change, inserted) => {
      if (inserted) Object.assign(doc, change.$setOnInsert);
      Object.assign(doc, change.$set);
      for (const [key, value] of Object.entries(change.$inc || {})) doc[key] = (doc[key] || 0) + value;
    };
    const collection = {
      async findOne(query) { return documents.find(doc => matches(doc, query)) || null; },
      find(query) { let results = documents.filter(doc => matches(doc, query)).slice(); return { sort(spec) { const [key, direction] = Object.entries(spec)[0]; results.sort((a,b) => a[key] > b[key] ? direction : a[key] < b[key] ? -direction : 0); return this; }, limit(n) { results = results.slice(0,n); return this; }, async toArray() { return results.map(doc => ({ ...doc })); } }; },
      async insertOne(doc) { documents.push({...doc}); return { acknowledged: true }; },
      async countDocuments(query) { return documents.filter(doc => matches(doc,query)).length; },
      async updateOne(query, change, options = {}) { let doc = documents.find(doc => matches(doc,query)); const inserted = !doc; if (!doc && options.upsert) { doc = {...query}; documents.push(doc); } if (!doc) return {matchedCount:0}; update(doc,change,inserted); return {matchedCount:1}; },
      async findOneAndUpdate(query, change, options) { await collection.updateOne(query,change,options); return collection.findOne(query); },
      async createIndex() { return 'test-index'; },
      async bulkWrite(operations) { for (const op of operations) { const u=op.updateOne; await collection.updateOne(u.filter,u.update,{upsert:u.upsert}); } }
    };
    return collection;
  } };
}
