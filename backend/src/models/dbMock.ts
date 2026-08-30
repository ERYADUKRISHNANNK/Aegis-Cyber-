import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Persistence File Paths
const usersFile = path.join(__dirname, "../../mock_db_users.json");
const auditsFile = path.join(__dirname, "../../mock_db_audits.json");
const threatsFile = path.join(__dirname, "../../mock_db_threats.json");
const sessionsFile = path.join(__dirname, "../../mock_db_sessions.json");
const filesFile = path.join(__dirname, "../../mock_db_files.json");
const activitiesFile = path.join(__dirname, "../../mock_db_activities.json");

// Helper IO routines
const loadData = (filePath: string): any[] => {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return [];
    }
  }
  return [];
};

const saveData = (filePath: string, data: any[]) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Persistent DB write error to ${filePath}:`, err);
  }
};

// Simulated Document wrapping
const createDocMethods = (item: any, collection: any[], filePath: string) => {
  return {
    ...item,
    save: async function() {
      const idx = collection.findIndex(x => x._id.toString() === this._id.toString());
      if (idx >= 0) {
        collection[idx] = { ...this };
      } else {
        collection.push({ ...this });
      }
      saveData(filePath, collection);
      return this;
    }
  };
};

export class MockUser {
  static async findOne(query: any) {
    const list = loadData(usersFile);
    const user = list.find(u => {
      if (query.username) {
        if (query.username.$regex) {
          if (!query.username.$regex.test(u.username)) return false;
        } else if (u.username !== query.username) {
          return false;
        }
      }
      if (query.email) {
        if (query.email.$regex) {
          if (!query.email.$regex.test(u.email)) return false;
        } else if (u.email !== query.email) {
          return false;
        }
      }
      if (query.$or) {
        return query.$or.some((sub: any) => {
          if (sub.username && u.username === sub.username) return true;
          if (sub.email && u.email === sub.email) return true;
          return false;
        });
      }
      return true;
    });
    return user ? createDocMethods(user, list, usersFile) : null;
  }

  static async findById(id: any) {
    const list = loadData(usersFile);
    const user = list.find(u => u._id.toString() === id.toString());
    return user ? createDocMethods(user, list, usersFile) : null;
  }

  static async create(data: any) {
    const list = loadData(usersFile);
    const user = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      whitelistedIps: data.whitelistedIps || [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(user);
    saveData(usersFile, list);
    return createDocMethods(user, list, usersFile);
  }

  static async find() {
    const list = loadData(usersFile);
    return list.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
  }
}

export class MockAuditLog {
  static async create(data: any) {
    const list = loadData(auditsFile);
    const log = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(log);
    saveData(auditsFile, list);
    return log;
  }

  static find(query: any = {}) {
    const list = loadData(auditsFile);
    let filtered = [...list];
    if (query.action && query.action.$in) {
      filtered = filtered.filter(l => query.action.$in.includes(l.action));
    }
    if (query.action && typeof query.action === 'string') {
      filtered = filtered.filter(l => l.action === query.action);
    }
    
    return {
      sort: () => ({
        limit: (n: number) => filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, n)
      })
    };
  }

  static async countDocuments(query: any = {}) {
    const list = loadData(auditsFile);
    let filtered = [...list];
    if (query.action && query.action.$in) {
      filtered = filtered.filter(l => query.action.$in.includes(l.action));
    }
    if (query.action && typeof query.action === 'string') {
      filtered = filtered.filter(l => l.action === query.action);
    }
    if (query.status) {
      filtered = filtered.filter(l => l.status === query.status);
    }
    return filtered.length;
  }
}

export class MockThreatReport {
  static async create(data: any) {
    const list = loadData(threatsFile);
    const report = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      status: "ACTIVE",
      actionTaken: "FILE_BLOCKED",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(report);
    saveData(threatsFile, list);
    return report;
  }

  static find() {
    const list = loadData(threatsFile);
    return {
      sort: () => ({
        limit: (n: number) => [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, n)
      })
    };
  }

  static async countDocuments(query: any = {}) {
    const list = loadData(threatsFile);
    if (query.status === "ACTIVE") {
      return list.filter(t => t.status === "ACTIVE").length;
    }
    return list.length;
  }
}

export class MockSessionLog {
  static async create(data: any) {
    const list = loadData(sessionsFile);
    const sess = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(sess);
    saveData(sessionsFile, list);
    return sess;
  }

  static findOne(query: any) {
    const list = loadData(sessionsFile);
    let filtered = [...list];
    
    if (query && query.userId) {
      filtered = filtered.filter(s => s.userId && s.userId.toString() === query.userId.toString());
    }
    if (query && query.token) {
      filtered = filtered.filter(s => s.token === query.token);
    }
    
    const result = {
      _filtered: filtered,
      sort: function(sortObj: any) {
        const sortedList = [...this._filtered].sort((a, b) => {
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return bDate - aDate;
        });
        return Promise.resolve(sortedList.length > 0 ? createDocMethods(sortedList[0], list, sessionsFile) : null);
      }
    };

    const sess = filtered.length > 0 ? filtered[0] : null;
    const promise = Promise.resolve(sess ? createDocMethods(sess, list, sessionsFile) : null) as any;
    promise.sort = result.sort.bind({ _filtered: filtered });
    return promise;
  }

  static async updateOne(filter: any, update: any) {
    const list = loadData(sessionsFile);
    const sess = list.find(s => s.token === filter.token);
    if (sess) {
      const changes = update.$set || update;
      if (changes.riskScore !== undefined) sess.riskScore = changes.riskScore;
      if (changes.keystrokeAvg !== undefined) sess.keystrokeAvg = changes.keystrokeAvg;
      if (changes.mouseJitterAvg !== undefined) sess.mouseJitterAvg = changes.mouseJitterAvg;
      if (changes.fingerprint !== undefined) sess.fingerprint = changes.fingerprint;
      if (changes.active !== undefined) sess.active = changes.active;
      if (changes.lastActive !== undefined) sess.lastActive = changes.lastActive;
      saveData(sessionsFile, list);
    }
    return { modifiedCount: sess ? 1 : 0 };
  }

  static async updateMany(filter: any, update: any) {
    const list = loadData(sessionsFile);
    const changes = update.$set || update;
    let modifiedCount = 0;

    for (const session of list) {
      const matchesUser = !filter.userId || session.userId?.toString() === filter.userId.toString();
      const matchesActive = filter.active === undefined || session.active === filter.active;
      const matchesFingerprint = filter.fingerprint === undefined || session.fingerprint === filter.fingerprint;
      const matchesToken = !filter.token || (filter.token.$ne !== undefined ? session.token !== filter.token.$ne : session.token === filter.token);

      if (matchesUser && matchesActive && matchesFingerprint && matchesToken) {
        Object.assign(session, changes);
        modifiedCount += 1;
      }
    }

    if (modifiedCount > 0) saveData(sessionsFile, list);
    return { modifiedCount };
  }

  static async countDocuments(query: any = {}) {
    const list = loadData(sessionsFile);
    const seen = new Set<string>();
    let count = 0;
    list.forEach(s => {
      if (query.userId && s.userId.toString() !== query.userId.toString()) return;
      if (query.active !== undefined && s.active !== query.active) return;
      const key = `${s.userId}_${s.token}`;
      if (!seen.has(key)) {
        seen.add(key);
        count++;
      }
    });
    return count;
  }
}

// Helper: make a mock query chain thenable so `await Model.find().sort().limit()` works
function makeThenable(chain: any) {
  const result = Object.create(chain);
  result.then = function(resolve: any, reject: any) {
    try {
      return Promise.resolve(chain._result).then(resolve, reject);
    } catch (e) {
      if (reject) return reject(e);
      throw e;
    }
  };
  result.catch = function(handler: any) {
    return Promise.resolve(chain._result).catch(handler);
  };
  return result;
}

export class MockFileDocument {
  static async create(data: any) {
    const list = loadData(filesFile);
    const file = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      isLocked: false,
      isRecycled: false,
      sharedWith: data.sharedWith || [],
      totalDownloads: data.totalDownloads || 0,
      totalShares: data.totalShares || 0,
      uniqueViewerIds: data.uniqueViewerIds || [],
      uniqueViewerCount: data.uniqueViewerCount || 0,
      versionNumber: data.versionNumber || 1,
      uploadIpAddress: data.uploadIpAddress || "",
      uploadGeoLocation: data.uploadGeoLocation || {},
      uploadDeviceFingerprint: data.uploadDeviceFingerprint || "",
      uploadUserAgent: data.uploadUserAgent || "",
      lastAccessedAt: data.lastAccessedAt || null,
      lastAccessedBy: data.lastAccessedBy || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(file);
    saveData(filesFile, list);
    return createDocMethods(file, list, filesFile);
  }

  static async findById(id: any) {
    const list = loadData(filesFile);
    const file = list.find(f => f._id.toString() === id.toString());
    return file ? createDocMethods(file, list, filesFile) : null;
  }

  static find(query: any = {}) {
    const list = loadData(filesFile);
    const userList = loadData(usersFile);
    let filtered = [...list];
    
    if (query.$or) {
      const ownerId = query.$or[0].owner;
      const accessorId = query.$or[1]["sharedWith.accessor"];
      filtered = filtered.filter(f => 
        (f.owner.toString() === ownerId.toString()) || 
        f.sharedWith.some((s: any) => s.accessor && s.accessor.toString() === accessorId.toString())
      );
    }

    // Support non-$or queries: match isRecycled, owner, etc.
    if (query.isRecycled !== undefined) {
      filtered = filtered.filter(f => f.isRecycled === query.isRecycled);
    }
    
    let current = [...filtered];
    let ref: any = null;

    const q: any = {
      sort: (sortObj: any) => {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        current.sort((a: any, b: any) => {
          const aVal = a[key]; const bVal = b[key];
          if (typeof aVal === "string") return dir * aVal.localeCompare(bVal);
          return dir * ((aVal || 0) - (bVal || 0));
        });
        return ref;
      },
      limit: (n: number) => { current = current.slice(0, n); return ref; },
      select: (fields: string) => {
        const fieldList = fields.split(" ").map(f => f.trim()).filter(Boolean);
        current = current.map(item => {
          const picked: any = { _id: item._id };
          for (const f of fieldList) {
            if (f in item) picked[f] = item[f];
          }
          return picked;
        });
        return ref;
      },
      populate: () => {
        current = current.map(f => {
          const ownerObj = userList.find(u => u._id.toString() === f.owner?.toString());
          return ownerObj ? { ...f, owner: { _id: ownerObj._id, username: ownerObj.username, email: ownerObj.email } } : f;
        });
        return ref;
      }
    };

    ref = Object.create(q);
    ref.then = (resolve: any, reject: any) => {
      // Populate owner by default
      const populated = current.map(f => {
        const ownerObj = userList.find(u => u._id.toString() === (f.owner?.toString?.() || f.owner));
        return ownerObj ? { ...f, owner: { _id: ownerObj._id, username: ownerObj.username, email: ownerObj.email } } : f;
      });
      return Promise.resolve([...populated]).then(resolve, reject);
    };
    ref.catch = (h: any) => Promise.resolve([...current]).catch(h);

    return ref;
  }

  static async findByIdAndUpdate(id: any, update: any, options?: any) {
    const list = loadData(filesFile);
    const idx = list.findIndex(f => f._id.toString() === id.toString());
    if (idx >= 0) {
      const changes = update.$set || update;
      Object.assign(list[idx], changes);
      saveData(filesFile, list);
      return createDocMethods(list[idx], list, filesFile);
    }
    return null;
  }

  static async findByIdAndDelete(id: any) {
    const list = loadData(filesFile);
    const idx = list.findIndex(f => f._id.toString() === id.toString());
    if (idx >= 0) {
      const deleted = list.splice(idx, 1)[0];
      saveData(filesFile, list);
      return deleted;
    }
    return null;
  }

  static async countDocuments() {
    return loadData(filesFile).length;
  }

  static async aggregate(pipeline: any[]) {
    let result: any[] = loadData(filesFile);

    for (const stage of pipeline) {
      if (stage.$match) {
        const match = stage.$match;
        if (match.owner) {
          result = result.filter(f => f.owner?.toString() === match.owner.toString());
        }
        if (match.isRecycled !== undefined) {
          result = result.filter(f => f.isRecycled === match.isRecycled);
        }
      }
      if (stage.$group) {
        const group = stage.$group;
        if (group._id === "$owner") {
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const key = item.owner?.toString() || "unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([key, items]) => ({
            _id: key,
            totalFiles: items.length,
            totalSize: items.reduce((sum: number, i: any) => sum + (i.fileSize || 0), 0)
          }));
        }
      }
    }

    return result;
  }
}

export class MockFileActivity {
  static async create(data: any) {
    const list = loadData(activitiesFile);
    const activity = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    list.push(activity);
    saveData(activitiesFile, list);
    return activity;
  }

  static find(query: any = {}) {
    const list = loadData(activitiesFile);
    let filtered = [...list];

    if (query.fileId) {
      filtered = filtered.filter(a => a.fileId?.toString() === query.fileId.toString());
    }
    if (query.performedBy) {
      filtered = filtered.filter(a => a.performedBy?.toString() === query.performedBy.toString());
    }
    if (query.eventType && typeof query.eventType === "string") {
      filtered = filtered.filter(a => a.eventType === query.eventType);
    }
    if (query.$and) {
      for (const condition of query.$and) {
        if (condition.timestamp && condition.timestamp.$gte) {
          filtered = filtered.filter(a => new Date(a.timestamp) >= new Date(condition.timestamp.$gte));
        }
        if (condition.timestamp && condition.timestamp.$lte) {
          filtered = filtered.filter(a => new Date(a.timestamp) <= new Date(condition.timestamp.$lte));
        }
      }
    }

    // Build a thenable chain so `await FileActivity.find().sort().limit()` works
    let current = [...filtered];
    let ref: any = null; // will point to the thenable after creation

    const q: any = {
      _filtered: filtered,
      sort: function(sortObj: any) {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        current.sort((a: any, b: any) => {
          const aVal = a[key];
          const bVal = b[key];
          return dir * (new Date(aVal).getTime() - new Date(bVal).getTime());
        });
        return ref; // return the thenable so await works
      },
      limit: function(n: number) {
        current = current.slice(0, n);
        return ref; // return the thenable so await works
      },
      populate: function() {
        return ref;
      }
    };

    // Make the query thenable (awaitable)
    ref = Object.create(q);
    ref.then = (resolve: any, reject: any) => {
      try {
        return Promise.resolve([...current]).then(resolve, reject);
      } catch (e) {
        if (reject) return reject(e);
        throw e;
      }
    };
    ref.catch = (handler: any) => Promise.resolve([...current]).catch(handler);

    return ref;
  }

  static async countDocuments(query: any = {}) {
    const list = loadData(activitiesFile);
    let filtered = [...list];
    if (query.fileId) {
      filtered = filtered.filter(a => a.fileId?.toString() === query.fileId.toString());
    }
    if (query.eventType && typeof query.eventType === "string") {
      filtered = filtered.filter(a => a.eventType === query.eventType);
    }
    return filtered.length;
  }

  static async aggregate(pipeline: any[]) {
    let result: any[] = loadData(activitiesFile);

    for (const stage of pipeline) {
      if (stage.$match) {
        const match = stage.$match;
        if (match.fileId) {
          result = result.filter(a => a.fileId?.toString() === match.fileId.toString());
        }
        if (match.eventType) {
          if (typeof match.eventType === "string") {
            result = result.filter(a => a.eventType === match.eventType);
          } else if (typeof match.eventType === "object" && match.eventType.$in) {
            result = result.filter(a => match.eventType.$in.includes(a.eventType));
          }
        }
        if (match.success !== undefined) {
          result = result.filter(a => a.success === match.success);
        }
        // Handle $ne on nested fields like geoLocation.city
        for (const [fieldPath, condition] of Object.entries(match)) {
          if (fieldPath.includes(".") && typeof condition === "object" && condition !== null && (condition as any).$ne !== undefined) {
            const parts = fieldPath.split(".");
            result = result.filter(a => {
              const val = parts.reduce((o: any, k: string) => o?.[k], a);
              return val !== (condition as any).$ne;
            });
          }
        }
        if (match.$and) {
          for (const cond of match.$and) {
            if (cond.timestamp && cond.timestamp.$gte) {
              result = result.filter(a => new Date(a.timestamp) >= new Date(cond.timestamp.$gte));
            }
          }
        }
      }
      if (stage.$group) {
        const group = stage.$group;
        if (group._id === "$eventType") {
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const key = item.eventType || "unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([key, items]) => ({ _id: key, count: items.length }));
        } else if (group._id === "$fileId") {
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const key = item.fileId?.toString() || "unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([key, items]) => ({
            _id: key, count: items.length, fileName: items[0]?.fileName || "unknown"
          }));
        } else if (group._id === "$performedByUsername") {
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const key = item.performedByUsername || "unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([key, items]) => ({ _id: key, count: items.length }));
        } else if (group._id && typeof group._id === "object") {
          // Object _id: group by multiple fields
          const fieldMap: Record<string, string> = {};
          for (const [k, v] of Object.entries(group._id)) {
            if (typeof v === "string" && v.startsWith("$")) {
              fieldMap[k] = v.replace("$", "");
            }
          }
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const keyParts: string[] = [];
            for (const [k, fieldPath] of Object.entries(fieldMap)) {
              const val = fieldPath.includes(".") ? fieldPath.split(".").reduce((o: any, p: string) => o?.[p], item) : item[fieldPath];
              keyParts.push(String(val || "unknown"));
            }
            const key = JSON.stringify(keyParts);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([keyStr, items]) => {
            const keyParts = JSON.parse(keyStr);
            const acc: any = { _id: {}, count: items.length };
            let idx = 0;
            for (const k of Object.keys(fieldMap)) {
              acc._id[k] = keyParts[idx++];
            }
            // Handle $first fields
            for (const [accKey, v] of Object.entries(group)) {
              if (accKey === "_id" || accKey === "count") continue;
              if (typeof v === "object" && v !== null && (v as any).$first) {
                const fieldPath = (v as any).$first.replace("$", "");
                const val = fieldPath.includes(".") ? fieldPath.split(".").reduce((o: any, p: string) => o?.[p], items[0]) : items[0][fieldPath];
                acc[accKey] = val;
              }
            }
            return acc;
          });
        } else if (group._id && typeof group._id === "string" && group._id.startsWith("$")) {
          const field = group._id.replace("$", "");
          const groups: Record<string, any[]> = {};
          for (const item of result) {
            const rawVal = field.includes(".") ? field.split(".").reduce((o: any, k: string) => o?.[k], item) : item[field];
            const key = typeof rawVal === "object" ? JSON.stringify(rawVal) : String(rawVal || "unknown");
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          result = Object.entries(groups).map(([key, items]) => {
            const acc: any = { _id: key, count: items.length };
            // Handle nested field aggregation
            if (group.count) acc.count = items.length;
            if (group.totalEvents) acc.totalEvents = items.length;
            if (group.country) acc.country = items[0]?.geoLocation?.country;
            if (group.lat) acc.lat = items[0]?.geoLocation?.lat;
            if (group.lon) acc.lon = items[0]?.geoLocation?.lon;
            if (group.uniqueIPs) acc.uniqueIPs = [...new Set(items.map(i => i.ipAddress))].length;
            if (group.eventTypes) acc.eventTypes = [...new Set(items.map(i => i.eventType))];
            if (group.users) acc.users = [...new Set(items.map(i => i.performedByUsername))];
            if (group.location) acc.location = items[0]?.geoLocation;
            return acc;
          });
        } else {
          result = [{ _id: "all", count: result.length }];
        }
      }
      if (stage.$sort) {
        const key = Object.keys(stage.$sort)[0];
        const dir = stage.$sort[key];
        result.sort((a: any, b: any) => {
          const aVal = key.includes(".") ? key.split(".").reduce((o: any, k: any) => o?.[k], a) : a[key];
          const bVal = key.includes(".") ? key.split(".").reduce((o: any, k: any) => o?.[k], b) : b[key];
          if (typeof aVal === "string") return dir * aVal.localeCompare(bVal);
          return dir * ((aVal || 0) - (bVal || 0));
        });
      }
      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
    }

    return result;
  }
}
